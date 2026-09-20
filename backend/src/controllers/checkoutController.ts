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

const cartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  shippingAddress: shippingAddressSchema,
});

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

    const ids = parsed.data.items.map((i) => i.productId);

    const prodRows = await db
      .select()
      .from(products)
      .where(and(inArray(products.id, ids), eq(products.active, true)));

    if (prodRows.length !== ids.length) {
      res.status(400).json({ error: "Some products not found" });
      return;
    }

    const byId = new Map(prodRows.map((p) => [p.id, p]));
    // totalPounds and unitPricePounds are whole Egyptian pounds (no piastres)
    const { totalPounds, lines } = computeCheckoutTotal(parsed.data.items, byId);

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
