import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db } from "../db";
import { productVariants, products } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { isUniqueViolation } from "../lib/dbErrors";
import { getEnv } from "../lib/env";
import { resolveBilingualField } from "../lib/translate";

const env = getEnv();

const variantRowSchema = z.object({
  // Present when editing an existing row, absent for a newly-added one.
  id: z.string().uuid().optional(),
  // Typed in either language — resolved into {label, labelAr} before it's
  // stored, same as product name/description. This endpoint always resends
  // every row on every save (not a per-field patch), so labelAr doubles as
  // a "this pair is already resolved, don't re-translate" signal: present
  // (including null) means label/labelAr are the final values verbatim;
  // absent means label is fresh input that needs resolving.
  label: z.string().trim().min(1).max(60),
  labelAr: z.string().trim().max(60).nullable().optional(),
  // null/omitted = untracked, unlimited stock for this variant
  stockQuantity: z.number().int().min(0).max(1_000_000).nullable().optional(),
});

const replaceVariantsSchema = z.object({
  variantName: z.string().trim().min(1).max(40).nullable(),
  // Same already-resolved-pair convention as variantRowSchema.labelAr.
  variantNameAr: z.string().trim().max(40).nullable().optional(),
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

    const { variantName, variantNameAr, variants } = parsed.data;

    if (!variantName || variants.length === 0) {
      await db.transaction(async (tx) => {
        await tx.update(products).set({ variantName: null, variantNameAr: null }).where(eq(products.id, productId));
        await tx.delete(productVariants).where(eq(productVariants.productId, productId));
      });
      res.json({ variantName: null, variantNameAr: null, variants: [] });
      return;
    }

    const [variantNameResolved, ...labelsResolved] = await Promise.all([
      variantNameAr !== undefined
        ? Promise.resolve({ en: variantName, ar: variantNameAr || null })
        : resolveBilingualField(env, variantName, { fallbackToSourceIfBlocked: true }),
      ...variants.map((v) =>
        v.labelAr !== undefined
          ? Promise.resolve({ en: v.label, ar: v.labelAr || null })
          : resolveBilingualField(env, v.label, { fallbackToSourceIfBlocked: true }),
      ),
    ]);

    const labels = labelsResolved.map((r) => r.en.toLowerCase());
    if (new Set(labels).size !== labels.length) {
      res.status(400).json({ error: "Variant labels must be unique" });
      return;
    }

    const result = await db.transaction(async (tx) => {
      await tx
        .update(products)
        .set({ variantName: variantNameResolved.en, variantNameAr: variantNameResolved.ar })
        .where(eq(products.id, productId));

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
        const { en: label, ar: labelAr } = labelsResolved[i];
        if (v.id && existingIds.has(v.id)) {
          const [updated] = await tx
            .update(productVariants)
            .set({ label, labelAr, stockQuantity, sortOrder: i })
            .where(eq(productVariants.id, v.id))
            .returning();
          rows.push(updated);
        } else {
          const [inserted] = await tx
            .insert(productVariants)
            .values({ productId, label, labelAr, stockQuantity, sortOrder: i })
            .returning();
          rows.push(inserted);
        }
      }
      return rows;
    });

    res.json({ variantName: variantNameResolved.en, variantNameAr: variantNameResolved.ar, variants: result });
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "Variant labels must be unique" });
      return;
    }
    next(err);
  }
}
