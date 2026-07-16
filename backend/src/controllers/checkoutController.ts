// backend/src/controllers/checkoutController.ts
import type { Request, Response, NextFunction } from "express";
import { getEnv } from "../lib/env";
import z from "zod";
import { getAuth } from "@clerk/express";
import { getLocalUser } from "../lib/users";
import { db } from "../db";
import { and, eq, inArray } from "drizzle-orm";
import { CheckoutSessionLine, checkoutSessions, products } from "../db/schema";
import { polarCreateCheckout } from "../lib/polar";

const env = getEnv();

const cartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export async function createCheckout(
  req: Request,
  res: Response,
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
    // totalPounds و unitPricePounds كلهم بالجنيه المصري الصحيح (أرقام كاملة، من غير قروش)
    let totalPounds = 0;
    const lines: CheckoutSessionLine[] = [];

    for (const line of parsed.data.items) {
      const prod = byId.get(line.productId)!;
      totalPounds += prod.pricePounds * line.quantity;
      lines.push({
        productId: prod.id,
        quantity: line.quantity,
        unitPricePounds: prod.pricePounds, // بالجنيه الصحيح، من غير أي ×100
      });
    }
    if (totalPounds < 50) {
      res.status(400).json({
        error: "Total below polar minimum (e.g. Total requires at least £50)",
      });
      return;
    }

    // بنخزن في الداتابيز بالجنيه الصحيح زي ما هو، من غير أي تحويل
    const [session] = await db
      .insert(checkoutSessions)
      .values({
        userId: localUser.id,
        lines,
        totalPounds,
        currency: "egp",
      })
      .returning();

    const successUrl = `${env.FRONTEND_URL}/checkout/return?checkout_id={CHECKOUT_ID}`;
    const returnUrl = `${env.FRONTEND_URL}/cart`;

    // النقطة الوحيدة في الكود كله اللي بتضرب ×100 - لأن Polar API
    // بيتطلب إجباريًا إن price_amount يتبعت بأصغر وحدة نقدية (قروش)
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
    console.error(err);

    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
