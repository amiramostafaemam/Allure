import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getAuth } from "@clerk/express";
import { db } from "../db";
import { savedAddresses } from "../db/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { getLocalUser } from "../lib/users";

// Same field bounds as checkoutController's shippingAddressSchema — this is
// the same address shape, just persisted instead of one-shot.
const addressSchema = z.object({
  label: z.string().trim().max(40).optional(),
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(30),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  governorate: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100),
  isDefault: z.boolean().optional(),
});

async function requireLocalUser(req: Request, res: Response) {
  const { userId, isAuthenticated } = getAuth(req);
  if (!isAuthenticated || !userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const localUser = await getLocalUser(userId);
  if (!localUser) {
    res.status(503).json({ error: "Account not synced yet" });
    return null;
  }
  return localUser;
}

export async function listAddresses(req: Request, res: Response, next: NextFunction) {
  try {
    const localUser = await requireLocalUser(req, res);
    if (!localUser) return;

    const rows = await db
      .select()
      .from(savedAddresses)
      .where(eq(savedAddresses.userId, localUser.id))
      .orderBy(desc(savedAddresses.isDefault), desc(savedAddresses.createdAt));

    res.json({ addresses: rows });
  } catch (err) {
    next(err);
  }
}

export async function createAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const localUser = await requireLocalUser(req, res);
    if (!localUser) return;

    const parsed = addressSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid address", details: parsed.error.flatten() });
      return;
    }

    const row = await db.transaction(async (tx) => {
      // A brand new address with nothing saved yet becomes the default by
      // itself — there's otherwise no way to pick one at checkout without
      // an extra step for what's the overwhelmingly common case (one
      // address).
      const [{ existingCount }] = await tx
        .select({ existingCount: count() })
        .from(savedAddresses)
        .where(eq(savedAddresses.userId, localUser.id));
      const makeDefault = parsed.data.isDefault ?? existingCount === 0;

      if (makeDefault) {
        await tx
          .update(savedAddresses)
          .set({ isDefault: false })
          .where(eq(savedAddresses.userId, localUser.id));
      }

      const [inserted] = await tx
        .insert(savedAddresses)
        .values({ ...parsed.data, userId: localUser.id, isDefault: makeDefault })
        .returning();
      return inserted;
    });

    res.status(201).json({ address: row });
  } catch (err) {
    next(err);
  }
}

export async function updateAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const localUser = await requireLocalUser(req, res);
    if (!localUser) return;

    const parsed = addressSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid address", details: parsed.error.flatten() });
      return;
    }

    const id = req.params.id as string;

    const row = await db.transaction(async (tx) => {
      if (parsed.data.isDefault) {
        await tx
          .update(savedAddresses)
          .set({ isDefault: false })
          .where(eq(savedAddresses.userId, localUser.id));
      }

      const [updated] = await tx
        .update(savedAddresses)
        .set(parsed.data)
        .where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, localUser.id)))
        .returning();
      return updated;
    });

    if (!row) {
      res.status(404).json({ error: "Address not found" });
      return;
    }

    res.json({ address: row });
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const localUser = await requireLocalUser(req, res);
    if (!localUser) return;

    const id = req.params.id as string;
    const [deleted] = await db
      .delete(savedAddresses)
      .where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, localUser.id)))
      .returning({ id: savedAddresses.id, wasDefault: savedAddresses.isDefault });

    if (!deleted) {
      res.status(404).json({ error: "Address not found" });
      return;
    }

    // Deleting the default silently leaves nothing marked default even
    // though other addresses still exist — promote the most recent
    // remaining one so there's still a sensible pre-fill at checkout.
    if (deleted.wasDefault) {
      const [next] = await db
        .select({ id: savedAddresses.id })
        .from(savedAddresses)
        .where(eq(savedAddresses.userId, localUser.id))
        .orderBy(desc(savedAddresses.createdAt))
        .limit(1);
      if (next) {
        await db.update(savedAddresses).set({ isDefault: true }).where(eq(savedAddresses.id, next.id));
      }
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
