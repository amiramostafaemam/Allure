import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { orderItems, orders, products, users } from "../db/schema";
import { and, count, desc, eq, gte, inArray, sql, sum } from "drizzle-orm";
import { FULFILLED_STATUSES } from "../lib/orderStatus";

const REVENUE_SERIES_DAYS = 30;

// Postgres only returns rows for days that actually had a fulfilled order,
// so a slow/new store's chart would show gaps rather than a continuous
// timeline — recharts would compress those missing points instead of
// plotting them as zero. Filling every day in JS (keyed by the same
// UTC-date string Postgres's own date_trunc produces) keeps the x-axis a
// real, unbroken calendar.
function fillDailySeries(rows: { day: string; total: number }[]) {
  const byDay = new Map(rows.map((r) => [r.day, r.total]));
  const series: { day: string; totalPounds: number }[] = [];
  const today = new Date();
  for (let i = REVENUE_SERIES_DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    series.push({ day: key, totalPounds: byDay.get(key) ?? 0 });
  }
  return series;
}

export async function getAdminStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [
      revenueRows,
      orderCountRows,
      customerCountRows,
      statusCounts,
      topProducts,
      recentOrders,
      revenueByDayRows,
    ] = await Promise.all([
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
      db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
          total: sql<number>`coalesce(sum(${orders.totalPounds}), 0)`,
        })
        .from(orders)
        .where(
          and(
            inArray(orders.status, FULFILLED_STATUSES),
            gte(orders.createdAt, sql`now() - interval '${sql.raw(String(REVENUE_SERIES_DAYS))} days'`),
          ),
        )
        .groupBy(sql`date_trunc('day', ${orders.createdAt})`),
    ]);

    res.json({
      revenuePounds: Number(revenueRows[0]?.total ?? 0),
      totalOrders: Number(orderCountRows[0]?.c ?? 0),
      totalCustomers: Number(customerCountRows[0]?.c ?? 0),
      ordersByStatus: Object.fromEntries(statusCounts.map((row) => [row.status, Number(row.c)])),
      topProducts: topProducts.map((row) => ({ ...row, totalQuantity: Number(row.totalQuantity ?? 0) })),
      recentOrders,
      revenueByDay: fillDailySeries(
        revenueByDayRows.map((r) => ({ day: r.day, total: Number(r.total) })),
      ),
    });
  } catch (err) {
    next(err);
  }
}
