import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db } from "../db";
import { categories, products } from "../db/schema";
import { asc, count, eq } from "drizzle-orm";
import { slugify } from "../lib/slugify";
import { isUniqueViolation } from "../lib/dbErrors";
import { getEnv } from "../lib/env";
import { resolveBilingualField } from "../lib/translate";

const env = getEnv();

// Typed in either language — resolved into {name, nameAr} before it's
// stored, same pattern as product name/description.
const nameSchema = z.object({
  name: z.string().trim().min(1).max(100),
});
const categoryPatchSchema = nameSchema.partial();

export async function listCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        nameAr: categories.nameAr,
        slug: categories.slug,
        createdAt: categories.createdAt,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(products, eq(products.category, categories.name))
      .groupBy(categories.id)
      .orderBy(asc(categories.name));

    res.json({ categories: rows.map((row) => ({ ...row, productCount: Number(row.productCount) })) });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = nameSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid category", details: parsed.error.flatten() });
      return;
    }

    const resolved = await resolveBilingualField(env, parsed.data.name, { fallbackToSourceIfBlocked: true });

    const [row] = await db
      .insert(categories)
      .values({
        name: resolved.en,
        nameAr: resolved.ar,
        slug: slugify(resolved.en),
      })
      .returning();

    res.status(201).json({ category: { ...row, productCount: 0 } });
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "A category with this name already exists" });
      return;
    }
    next(err);
  }
}

export async function renameCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = categoryPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid category", details: parsed.error.flatten() });
      return;
    }
    if (parsed.data.name === undefined) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const id = req.params.id as string;

    const [existing] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    const resolved = await resolveBilingualField(env, parsed.data.name, { fallbackToSourceIfBlocked: true });
    const newName = resolved.en;
    const newNameAr = resolved.ar;

    if (existing.name === newName && existing.nameAr === newNameAr) {
      res.json({ category: existing });
      return;
    }

    const [updated] = await db.transaction(async (tx) => {
      // Only bulk-update products when the English name (the actual FK-ish
      // value products.category stores) is the part that changed.
      if (newName !== existing.name) {
        await tx.update(products).set({ category: newName }).where(eq(products.category, existing.name));
      }
      return tx
        .update(categories)
        .set({ name: newName, nameAr: newNameAr, slug: slugify(newName) })
        .where(eq(categories.id, id))
        .returning();
    });

    res.json({ category: updated });
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "A category with this name already exists" });
      return;
    }
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [existing] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);

    if (!existing) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    const [countRow] = await db.select({ c: count() }).from(products).where(eq(products.category, existing.name));

    if (Number(countRow?.c ?? 0) > 0) {
      res.status(409).json({ error: "This category still has products. Reassign or delete them first." });
      return;
    }

    await db.delete(categories).where(eq(categories.id, id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
