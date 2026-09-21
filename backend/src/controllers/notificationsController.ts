import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "../db";
import { notifications } from "../db/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { getLocalUser } from "../lib/users";
import { parsePagination } from "../lib/pagination";

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

    const [rows, [unreadRow]] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, localUser.id))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ c: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, localUser.id), eq(notifications.read, false))),
    ]);

    res.json({ notifications: rows, unreadCount: Number(unreadRow?.c ?? 0) });
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
