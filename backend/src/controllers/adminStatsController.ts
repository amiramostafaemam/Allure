import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { orderItems, orders, products, users } from "../db/schema";
import { count, desc, eq, inArray, sum } from "drizzle-orm";
import { FULFILLED_STATUSES } from "../lib/orderStatus";

export async function getAdminStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [revenueRows, orderCountRows, customerCountRows, statusCounts, topProducts, recentOrders] =
      await Promise.all([
        db
          .select({ total: sum(orders.totalPounds) })
          .from(orders)
          .where(inArray(orders.status, FULFILLED_STATUSES)),
        db.select({ c: count() }).from(orders),
        db.select({ c: count() }).from(users),
        db.select({ status: orders.status, c: count() }).from(orders).groupBy(orders.status),
        db
          .select({
            productId: orderItems.productId,
            name: products.name,
            slug: products.slug,
            totalQuantity: sum(orderItems.quantity),
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .groupBy(orderItems.productId, products.name, products.slug)
          .orderBy(desc(sum(orderItems.quantity)))
          .limit(5),
        db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5),
      ]);

    res.json({
      revenuePounds: Number(revenueRows[0]?.total ?? 0),
      totalOrders: Number(orderCountRows[0]?.c ?? 0),
      totalCustomers: Number(customerCountRows[0]?.c ?? 0),
      ordersByStatus: Object.fromEntries(statusCounts.map((row) => [row.status, Number(row.c)])),
      topProducts: topProducts.map((row) => ({ ...row, totalQuantity: Number(row.totalQuantity ?? 0) })),
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
}
