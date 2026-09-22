import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db } from "../db";
import { promoCodes } from "../db/schema";
import { desc, eq } from "drizzle-orm";
import { isUniqueViolation } from "../lib/dbErrors";

const createSchema = z.object({
  code: z.string().trim().min(2).max(40),
  percentOff: z.number().int().min(1).max(100),
  expiresAt: z.string().datetime().optional().nullable(),
});

const updateSchema = z.object({
  active: z.boolean().optional(),
  percentOff: z.number().int().min(1).max(100).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function listPromoCodes(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
    res.json({ promoCodes: rows });
  } catch (err) {
    next(err);
  }
}

export async function createPromoCode(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid promo code", details: parsed.error.flatten() });
      return;
    }

    const [row] = await db
      .insert(promoCodes)
      .values({
        code: parsed.data.code.trim().toUpperCase(),
        percentOff: parsed.data.percentOff,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      })
      .returning();

    res.status(201).json({ promoCode: row });
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "A promo code with this code already exists" });
      return;
    }
    next(err);
  }
}

export async function updatePromoCode(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid promo code", details: parsed.error.flatten() });
      return;
    }

    const data: Partial<typeof promoCodes.$inferInsert> = {};
    if (parsed.data.active !== undefined) data.active = parsed.data.active;
    if (parsed.data.percentOff !== undefined) data.percentOff = parsed.data.percentOff;
    if (parsed.data.expiresAt !== undefined) {
      data.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
    }

    const [row] = await db
      .update(promoCodes)
      .set(data)
      .where(eq(promoCodes.id, req.params.id as string))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Promo code not found" });
      return;
    }

    res.json({ promoCode: row });
  } catch (err) {
    next(err);
  }
}

export async function deletePromoCode(req: Request, res: Response, next: NextFunction) {
  try {
    const [row] = await db
      .delete(promoCodes)
      .where(eq(promoCodes.id, req.params.id as string))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Promo code not found" });
      return;
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
