import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { promoCodes } from "../db/schema";

// Same floor createCheckout already enforces for a cart with no code — a
// discount is capped so the charged total never drops below it.
const POLAR_MINIMUM_POUNDS = 50;

export async function findActivePromoCode(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const [row] = await db
    .select()
    .from(promoCodes)
    .where(and(eq(promoCodes.code, normalized), eq(promoCodes.active, true)))
    .limit(1);

  if (!row) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;

  return row;
}

export function applyPromoCode(
  subtotalPounds: number,
  percentOff: number,
): { discountPounds: number; totalPounds: number } {
  const rawDiscount = Math.round((subtotalPounds * percentOff) / 100);
  const maxDiscount = Math.max(subtotalPounds - POLAR_MINIMUM_POUNDS, 0);
  const discountPounds = Math.min(rawDiscount, maxDiscount);
  return { discountPounds, totalPounds: subtotalPounds - discountPounds };
}
