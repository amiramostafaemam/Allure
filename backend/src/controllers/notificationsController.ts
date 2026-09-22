import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "../db";
import { notifications, orders } from "../db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getLocalUser } from "../lib/users";
import { parsePagination } from "../lib/pagination";
import { groupNotificationsByOrder } from "../lib/notifications";

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
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

    const { limit, offset } = parsePagination(req, 20);

    // Fetch a bounded window of the most recent raw rows and group them by
    // order in JS (rows already come back newest-first, so the first row
    // seen per orderId is the group's latest) — multiple chat-message
    // notifications for the same order collapse into one entry with a count
    // instead of flooding the list one row per message.
    const rawRows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, localUser.id))
      .orderBy(desc(notifications.createdAt))
      .limit(200);

    const grouped = groupNotificationsByOrder(rawRows);
    const page = grouped.slice(offset, offset + limit);
    const orderIds = page.map((g) => g.orderId);

    const orderNumberByOrderId = new Map<string, number>();
    if (orderIds.length > 0) {
      const orderRows = await db
        .select({ id: orders.id, orderNumber: orders.orderNumber })
        .from(orders)
        .where(inArray(orders.id, orderIds));
      for (const row of orderRows) orderNumberByOrderId.set(row.id, row.orderNumber);
    }

    const groupsPayload = page.map((g) => ({ ...g, orderNumber: orderNumberByOrderId.get(g.orderId) ?? null }));
    const unreadCount = grouped.filter((g) => !g.read).length;

    res.json({ notifications: groupsPayload, unreadCount });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req: Request, res: Response, next: NextFunction) {
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

    const [row] = await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, req.params.id as string), eq(notifications.userId, localUser.id)))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    res.json({ notification: row });
  } catch (err) {
    next(err);
  }
}

// Bulk version of markNotificationRead, scoped to one order — used when the
// bell's grouped entry (one order, possibly several stacked notifications)
// is clicked, so the whole group clears at once instead of just its latest row.
export async function markOrderNotificationsRead(req: Request, res: Response, next: NextFunction) {
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
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, localUser.id),
          eq(notifications.orderId, req.params.orderId as string),
          eq(notifications.read, false),
        ),
      );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
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
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, localUser.id), eq(notifications.read, false)));

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
