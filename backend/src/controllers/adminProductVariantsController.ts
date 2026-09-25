import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db } from "../db";
import { productVariants, products } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { isUniqueViolation } from "../lib/dbErrors";

const variantRowSchema = z.object({
  // Present when editing an existing row, absent for a newly-added one.
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(60),
  // null/omitted = untracked, unlimited stock for this variant
  stockQuantity: z.number().int().min(0).max(1_000_000).nullable().optional(),
});

const replaceVariantsSchema = z.object({
  variantName: z.string().trim().min(1).max(40).nullable(),
  variants: z.array(variantRowSchema).max(20),
});

// Replaces a product's whole variant set in one call — matches the admin
// form's UX (edit a local list, save once) rather than granular per-row
// endpoints. An empty/null variantName with no variants clears the product
// back to having none at all.
export async function replaceProductVariants(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = replaceVariantsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid variants", details: parsed.error.flatten() });
      return;
    }

    const productId = req.params.productId as string;
    const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const { variantName, variants } = parsed.data;

    if (!variantName || variants.length === 0) {
      await db.transaction(async (tx) => {
        await tx.update(products).set({ variantName: null }).where(eq(products.id, productId));
        await tx.delete(productVariants).where(eq(productVariants.productId, productId));
      });
      res.json({ variantName: null, variants: [] });
      return;
    }

    const labels = variants.map((v) => v.label.trim().toLowerCase());
    if (new Set(labels).size !== labels.length) {
      res.status(400).json({ error: "Variant labels must be unique" });
      return;
    }

    const result = await db.transaction(async (tx) => {
      await tx.update(products).set({ variantName }).where(eq(products.id, productId));

      const existing = await tx
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(eq(productVariants.productId, productId));
      const existingIds = new Set(existing.map((r) => r.id));
      const keepIds = new Set(variants.filter((v) => v.id).map((v) => v.id as string));

      const toDelete = [...existingIds].filter((id) => !keepIds.has(id));
      if (toDelete.length > 0) {
        await tx.delete(productVariants).where(inArray(productVariants.id, toDelete));
      }

      const rows = [];
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const stockQuantity = v.stockQuantity ?? null;
        if (v.id && existingIds.has(v.id)) {
          const [updated] = await tx
            .update(productVariants)
            .set({ label: v.label, stockQuantity, sortOrder: i })
            .where(eq(productVariants.id, v.id))
            .returning();
          rows.push(updated);
        } else {
          const [inserted] = await tx
            .insert(productVariants)
            .values({ productId, label: v.label, stockQuantity, sortOrder: i })
            .returning();
          rows.push(inserted);
        }
      }
      return rows;
    });

    res.json({ variantName, variants: result });
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "Variant labels must be unique" });
      return;
    }
    next(err);
  }
}
