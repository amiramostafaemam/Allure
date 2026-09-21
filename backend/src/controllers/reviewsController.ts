import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { z } from "zod";
import { db } from "../db";
import { orderItems, orders, products, reviews, users } from "../db/schema";
import { and, avg, count, desc, eq, inArray } from "drizzle-orm";
import { getLocalUser } from "../lib/users";
import { isUniqueViolation } from "../lib/dbErrors";
import { FULFILLED_STATUSES } from "../lib/orderStatus";

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

async function findActiveProduct(slug: string) {
  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return product && product.active ? product : undefined;
}

async function hasVerifiedPurchase(userId: string, productId: string) {
  const [row] = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.userId, userId),
        eq(orderItems.productId, productId),
        inArray(orders.status, FULFILLED_STATUSES),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function listReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await findActiveProduct(req.params.slug as string);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const [rows, [summary]] = await Promise.all([
      db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          reviewerName: users.displayName,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.productId, product.id))
        .orderBy(desc(reviews.createdAt)),
      db
        .select({ average: avg(reviews.rating), count: count() })
        .from(reviews)
        .where(eq(reviews.productId, product.id)),
    ]);

    let canReview: boolean | undefined;
    const { userId, isAuthenticated } = getAuth(req);
    if (isAuthenticated && userId) {
      const localUser = await getLocalUser(userId);
      if (localUser) {
        const [alreadyReviewed, verifiedPurchase] = await Promise.all([
          db.select({ id: reviews.id }).from(reviews)
            .where(and(eq(reviews.productId, product.id), eq(reviews.userId, localUser.id)))
            .limit(1),
          hasVerifiedPurchase(localUser.id, product.id),
        ]);
        canReview = alreadyReviewed.length === 0 && verifiedPurchase;
      }
    }

    res.json({
      reviews: rows,
      averageRating: summary?.average ? Number(summary.average) : null,
      count: Number(summary?.count ?? 0),
      canReview,
    });
  } catch (err) {
    next(err);
  }
}

export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid review", details: parsed.error.flatten() });
      return;
    }

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const product = await findActiveProduct(req.params.slug as string);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    if (!(await hasVerifiedPurchase(localUser.id, product.id))) {
      res.status(403).json({ error: "Only customers who purchased this product can review it" });
      return;
    }

    const [row] = await db
      .insert(reviews)
      .values({
        productId: product.id,
        userId: localUser.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
      })
      .returning();

    res.status(201).json({ review: { ...row, reviewerName: localUser.displayName } });
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "You've already reviewed this product" });
      return;
    }
    next(err);
  }
}
