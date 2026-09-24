// backend/src/controllers/checkoutController.ts
import type { Request, Response, NextFunction } from "express";
import { getEnv } from "../lib/env";
import z from "zod";
import { getAuth } from "@clerk/express";
import { getLocalUser } from "../lib/users";
import { db } from "../db";
import { and, eq, inArray } from "drizzle-orm";
import { checkoutSessions, products } from "../db/schema";
import { polarCreateCheckout } from "../lib/polar";
import { computeCheckoutTotal } from "../lib/pricing";
import { applyPromoCode, findActivePromoCode } from "../lib/promoCodes";

const env = getEnv();

const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(30),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  governorate: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100),
});

const cartItemsSchema = z
  .array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive().max(99),
    }),
  )
  .min(1);

const cartSchema = z.object({
  items: cartItemsSchema,
  shippingAddress: shippingAddressSchema,
  promoCode: z.string().trim().min(1).max(40).optional(),
});

const promoValidateSchema = z.object({
  items: cartItemsSchema,
  promoCode: z.string().trim().min(1).max(40),
});

// Shared by createCheckout and validatePromoCode — resolves cart items
// against `products` and computes the subtotal. Never trusts client-sent
// prices; only product ids + quantities come from the request.
async function resolveCartSubtotal(items: z.infer<typeof cartItemsSchema>) {
  const ids = items.map((i) => i.productId);

  const prodRows = await db
    .select()
    .from(products)
    .where(and(inArray(products.id, ids), eq(products.active, true)));

  if (prodRows.length !== ids.length) {
    return { ok: false as const, error: "Some products not found" };
  }

  const byId = new Map(prodRows.map((p) => [p.id, p]));

  // null stockQuantity = untracked/unlimited, skip the check entirely
  for (const item of items) {
    const product = byId.get(item.productId)!;
    if (product.stockQuantity !== null && item.quantity > product.stockQuantity) {
      return {
        ok: false as const,
        error:
          product.stockQuantity > 0
            ? `Only ${product.stockQuantity} left of "${product.name}"`
            : `"${product.name}" is out of stock`,
      };
    }
  }

  const { totalPounds: subtotalPounds, lines } = computeCheckoutTotal(items, byId);
  return { ok: true as const, subtotalPounds, lines };
}

export async function createCheckout(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const parsed = cartSchema.safeParse(req.body);

    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Invalid cart", details: parsed.error.flatten() });
      return;
    }

    if (!env.POLAR_ACCESS_TOKEN) {
      res.status(503).json({ error: "Payments are not configured" });
      return;
    }

    const localUser = await getLocalUser(userId);

    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    // totalPounds and unitPricePounds are whole Egyptian pounds (no piastres)
    const resolved = await resolveCartSubtotal(parsed.data.items);
    if (!resolved.ok) {
      res.status(400).json({ error: resolved.error });
      return;
    }
    const { subtotalPounds, lines } = resolved;

    let totalPounds = subtotalPounds;
    let discountPounds = 0;
    let appliedPromoCode: string | null = null;

    if (parsed.data.promoCode) {
      const promo = await findActivePromoCode(parsed.data.promoCode);
      if (!promo) {
        res.status(400).json({ error: "Invalid or expired promo code" });
        return;
      }
      const applied = applyPromoCode(subtotalPounds, promo.percentOff);
      discountPounds = applied.discountPounds;
      totalPounds = applied.totalPounds;
      appliedPromoCode = promo.code;
    }

    if (totalPounds < 50) {
      res.status(400).json({
        error: "Total below polar minimum (e.g. Total requires at least £50)",
      });
      return;
    }

    // stored in the database as whole pounds, unconverted
    const [session] = await db
      .insert(checkoutSessions)
      .values({
        userId: localUser.id,
        lines,
        totalPounds,
        currency: "egp",
        shippingAddress: parsed.data.shippingAddress,
        promoCode: appliedPromoCode,
        discountPounds,
      })
      .returning();

    const successUrl = `${env.FRONTEND_URL}/checkout/return?checkout_id={CHECKOUT_ID}`;
    const returnUrl = `${env.FRONTEND_URL}/cart`;

    // The only place in the codebase that multiplies by 100 - Polar's API
    // requires price_amount in the smallest currency unit (piastres).
    const checkout = await polarCreateCheckout(env, {
      products: [env.POLAR_CHECKOUT_PRODUCT_ID],
      prices: {
        [env.POLAR_CHECKOUT_PRODUCT_ID]: [
          {
            amount_type: "fixed",
            price_amount: totalPounds * 100,
            price_currency: "egp",
          },
        ],
      },
      success_url: successUrl,
      return_url: returnUrl,
      external_customer_id: userId,
      metadata: { checkout_session_id: session.id },
    });

    await db
      .update(checkoutSessions)
      .set({ polarCheckoutId: checkout.id })
      .where(eq(checkoutSessions.id, session.id));

    res.json({ checkoutUrl: checkout.url });
  } catch (err) {
    next(err);
  }
}

// Preview-only: checks a code and returns what it would discount, without
// creating a checkout session. createCheckout() independently re-validates
// and recomputes at submit time — this response is never trusted as-is.
export async function validatePromoCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { isAuthenticated } = getAuth(req);
    if (!isAuthenticated) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = promoValidateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }

    const resolved = await resolveCartSubtotal(parsed.data.items);
    if (!resolved.ok) {
      res.json({ valid: false, error: resolved.error });
      return;
    }

    const promo = await findActivePromoCode(parsed.data.promoCode);
    if (!promo) {
      res.json({ valid: false, error: "Invalid or expired promo code" });
      return;
    }

    const { discountPounds, totalPounds } = applyPromoCode(resolved.subtotalPounds, promo.percentOff);
    res.json({ valid: true, code: promo.code, percentOff: promo.percentOff, discountPounds, totalPounds });
  } catch (err) {
    next(err);
  }
}
