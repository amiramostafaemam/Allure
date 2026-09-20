import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { z } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import { count, desc, eq } from "drizzle-orm";
import { getLocalUser } from "../lib/users";
import { parsePagination } from "../lib/pagination";

const updateRoleSchema = z.object({ role: z.enum(["customer", "support", "admin"]) });

export async function listCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit, offset } = parsePagination(req);

    const [rows, [totalRow]] = await Promise.all([
      db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      db.select({ c: count() }).from(users),
    ]);

    res.json({ customers: rows, total: Number(totalRow?.c ?? 0), limit, offset });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomerRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid role", details: parsed.error.flatten() });
      return;
    }

    const actingUser = await getLocalUser(userId);
    if (!actingUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const targetId = req.params.id as string;

    if (targetId === actingUser.id && parsed.data.role !== "admin") {
      res.status(400).json({ error: "You can't remove your own admin role" });
      return;
    }

    const [updated] = await db
      .update(users)
      .set({ role: parsed.data.role, updatedAt: new Date() })
      .where(eq(users.id, targetId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    res.json({ customer: updated });
  } catch (err) {
    next(err);
  }
}
