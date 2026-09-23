import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getAuth } from "@clerk/express";
import { db } from "../db";
import { products, wishlistItems } from "../db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getLocalUser } from "../lib/users";
import { isUniqueViolation } from "../lib/dbErrors";

const addSchema = z.object({ productId: z.string() });

export async function listWishlist(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const rows = await db
      .select({
        productId: wishlistItems.productId,
        createdAt: wishlistItems.createdAt,
        product: products,
      })
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.userId, localUser.id))
      .orderBy(desc(wishlistItems.createdAt));

    res.json({
      // Products removed by admin (deactivated) still show a heart on
      // their card, but shouldn't clutter the wishlist page — surfacing a
      // product the customer can no longer buy isn't useful here the way
      // an inactive product's order history still is.
      items: rows.filter((r) => r.product.active).map((r) => r.product),
    });
  } catch (err) {
    next(err);
  }
}

export async function addToWishlist(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid product" });
      return;
    }

    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, parsed.data.productId), eq(products.active, true)))
      .limit(1);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    try {
      await db.insert(wishlistItems).values({ userId: localUser.id, productId: parsed.data.productId });
    } catch (err) {
      // Already saved — treat as success rather than an error the UI has
      // to specially handle (the end state the caller wanted is already true).
      if (!isUniqueViolation(err)) throw err;
    }

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function removeFromWishlist(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    await db
      .delete(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, localUser.id),
          eq(wishlistItems.productId, req.params.productId as string),
        ),
      );

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
