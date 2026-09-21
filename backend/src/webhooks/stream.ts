import type { Request, Response } from "express";
import { getEnv } from "../lib/env";
import { getStreamChatServer } from "../lib/stream";
import { db } from "../db";
import { notifications, orders, users } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { getLocalUser } from "../lib/users";
import { clerkUserIdFromStreamId, messagePreview, orderIdFromChannelId } from "../lib/notifications";

export async function streamWebhookHandler(req: Request, res: Response) {
  const env = getEnv();
  try {
    const raw = req.body instanceof Buffer ? req.body : Buffer.from(String(req.body));
    const signature = req.headers["x-signature"];

    if (typeof signature !== "string") {
      res.status(400).send("Missing X-Signature header");
      return;
    }

    const server = getStreamChatServer(env);
    if (!server.verifyWebhook(raw, signature)) {
      res.status(401).send("Invalid signature");
      return;
    }

    const event = JSON.parse(raw.toString("utf8")) as {
      type?: string;
      channel_id?: string;
      user?: { id?: string };
      message?: { id?: string; text?: string };
    };

    if (event.type !== "message.new" || !event.channel_id) {
      res.json({ ok: true });
      return;
    }

    const orderId = orderIdFromChannelId(event.channel_id);
    const senderClerkId = event.user?.id ? clerkUserIdFromStreamId(event.user.id) : undefined;

    if (!orderId || !senderClerkId) {
      res.json({ ok: true });
      return;
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      res.json({ ok: true });
      return;
    }

    const sender = await getLocalUser(senderClerkId);
    if (!sender) {
      res.json({ ok: true });
      return;
    }

    const preview = messagePreview(event.message?.text);
    const isCustomerSender = sender.id === order.userId;

    // Customer messages notify every staff/admin; staff messages notify the
    // order's customer. Never notify the sender themselves (matters if a
    // staff account is also testing as the order owner).
    const recipientIds = isCustomerSender
      ? (await db.select({ id: users.id }).from(users).where(inArray(users.role, ["admin", "support"])))
          .map((row) => row.id)
      : [order.userId];

    const rows = recipientIds
      .filter((id) => id !== sender.id)
      .map((userId) => ({
        userId,
        orderId: order.id,
        message: preview,
        streamMessageId: event.message?.id ?? null,
      }));

    if (rows.length > 0) {
      // Stream redelivers message.new at least once in practice — this
      // upsert target (userId, streamMessageId) makes a redelivery a no-op
      // instead of a duplicate notification per recipient.
      await db
        .insert(notifications)
        .values(rows)
        .onConflictDoNothing({ target: [notifications.userId, notifications.streamMessageId] });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Error while processing Stream webhook", err);
    res.status(400).json({ error: "Invalid webhook" });
  }
}
