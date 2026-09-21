import { getAuth } from '@clerk/express';
import type {Request,Response,NextFunction} from 'express';
import { getLocalUser } from '../lib/users';
import { isStaff } from '../lib/roles';
import { db } from '../db';
import { notifications, orderItems, orders, orderStatusEvents, products, users } from '../db/schema';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { getStreamChatServer, streamChatDisplayName, streamUserId } from '../lib/stream';
import { getEnv } from '../lib/env';
import { parsePagination } from '../lib/pagination';
import { canTransition, isChatEligible, MANUAL_STATUSES, REQUESTABLE_STATUSES } from '../lib/orderStatus';
import { z } from 'zod';

const env=getEnv();

export async function listOrders(req: Request, res: Response, next: NextFunction) {
    try{
        const {userId , isAuthenticated}=getAuth(req);
        if(!isAuthenticated||!userId){
            res.status(401).json({error:"Unauthorized"});
            return;
        }

        const localUser=await getLocalUser(userId);

        if(!localUser){
            res.status(503).json({error:"Account not synced yet"});
            return;
        }

        const {limit,offset}=parsePagination(req);
        const staffView=isStaff(localUser.role);

        const rows=staffView
            ? await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit).offset(offset)
            : await db.select().from(orders).where(eq(orders.userId,localUser.id)).orderBy(desc(orders.createdAt)).limit(limit).offset(offset);

        const orderIds=rows.map((r)=>r.id);
        const previewByOrder=new Map();
        const customerByUserId=new Map();

        if(staffView && rows.length>0){
            const customerIds=[...new Set(rows.map((r)=>r.userId))];
            const customerRows=await db.select({id:users.id,email:users.email,displayName:users.displayName})
                .from(users)
                .where(inArray(users.id,customerIds));

            for(const c of customerRows){
                customerByUserId.set(c.id,c);
            }
        }

       if(orderIds.length>0){
            const orderItemsRows=await db.select({
                orderId:orderItems.orderId,quantity:orderItems.quantity,       
                name:products.name,
                slug:products.slug,imageUrl:products.imageUrl})
                .from(orderItems)
                .innerJoin(products,eq(orderItems.productId,products.id))
                .where(inArray(orderItems.orderId,orderIds))
                .orderBy(asc(orderItems.id));

            for(const orderItemRow of orderItemsRows){
                const list=previewByOrder.get(orderItemRow.orderId) ?? [];
                list.push({
                    name:orderItemRow.name,
                    quantity:orderItemRow.quantity,
                    slug:orderItemRow.slug,
                    imageUrl:orderItemRow.imageUrl
                });
                previewByOrder.set(orderItemRow.orderId,list);
            }
        }

        const ordersPayload=rows.map((r)=>({
            ...r,
            previewItems:previewByOrder.get(r.id) ?? [],
            ...(staffView ? {customer:customerByUserId.get(r.userId) ?? null} : {}),
        }));
        res.json({orders:ordersPayload,limit,offset});
                
    }catch(err){
        next(err);
    }
}  

export async function getOrder(req:Request,res:Response,next:NextFunction){
    try{
        const {userId , isAuthenticated}=getAuth(req);
        if(!isAuthenticated||!userId){
            res.status(401).json({error:"Unauthorized"});
            return;
        }

        const localUser=await getLocalUser(userId);

        if(!localUser){
            res.status(503).json({error:"Account not synced yet"});
            return;
        }

        const [order]=await db.select().from(orders).where(eq(orders.id,req.params.id as string)).limit(1);

        if(!order){
            res.status(404).json({error:"Order not found"});
            return;
        }

        const canAccess=order.userId===localUser.id || isStaff(localUser.role);

        if(!canAccess){
            res.status(404).json({error:"Not found"});
            return;
        }

        const orderItemsRows=await db.select({
            orderId:orderItems.id,quantity:orderItems.quantity,
            unitPricePounds:orderItems.unitPricePounds,
            product:products
        }).from(orderItems)
        .innerJoin(products,eq(orderItems.productId,products.id))
        .where(eq(orderItems.orderId,order.id));

        const statusEvents=await db.select().from(orderStatusEvents)
            .where(eq(orderStatusEvents.orderId,order.id))
            .orderBy(asc(orderStatusEvents.createdAt));

        res.json({order,orderItemsRows,statusEvents});

    }catch(err){
        next(err);
    }
}

export async function createStreamChannel(req:Request,res:Response,next:NextFunction){
    try{
        const {userId , isAuthenticated}=getAuth(req);
        if(!isAuthenticated||!userId){
            res.status(401).json({error:"Unauthorized"});
            return;
        }

        const streamChatServer=getStreamChatServer(env);
       
        const localUser=await getLocalUser(userId);

        if(!localUser){
            res.status(503).json({error:"Account not synced yet"});
            return;
        }
        const [order]=await db.select().from(orders).where(eq(orders.id,req.params.id as string)).limit(1);

        if(!order){
            res.status(404).json({error:"Order not found"});
            return;
        }

        const isOwner=order.userId===localUser.id;

        if(!isOwner && !isStaff(localUser.role)){
            res.status(404).json({error:"Not found"});
            return;
        }

        if(!isChatEligible(order.status)){
            res.status(403).json({error:"Order must be paid to open support chat"});
            return;
        }

        const streamChatUserId=streamUserId(userId);

        await streamChatServer.upsertUser({
            id:streamChatUserId,
            name:streamChatDisplayName(localUser.role,localUser.displayName,localUser.email),
            image:localUser.avatarUrl ?? undefined,
        });

        // Stream channel IDs can't contain ":" (it rejects the request).
        const channelId=`order-${order.id}`;
        const channel=streamChatServer.channel("messaging",channelId,{name:`Support for order #${order.id.slice(0,8)}`,
        created_by_id:streamChatUserId});

        await channel.create();

        await channel.addMembers([streamChatUserId]);

        res.json({channelType:"messaging",channelId,streamUserId:streamChatUserId});
        

}catch(err){
    next(err);
}
}

export async function createVideoInvite(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const server = getStreamChatServer(env);

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    if (!isStaff(localUser.role)) {
      res.status(403).json({ error: "Only support or admin can send a video invite" });
      return;
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, req.params.id as string))
      .limit(1);

    if (!order || !isChatEligible(order.status)) {
      res.status(404).json({ error: "Order not found or not paid" });
      return;
    }

    const [owner] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);

    if (!owner) {
      res.status(404).json({ error: "Order owner not found" });
      return;
    }

    const customerSid = streamUserId(owner.clerkUserId);
    await server.upsertUser({
      id: customerSid,
      name: owner.displayName ?? owner.email ?? "Customer",
      image: owner.avatarUrl ?? undefined,
    });

    const staffStreamUserId = streamUserId(userId);
    await server.upsertUser({
      id: staffStreamUserId,
      name: streamChatDisplayName(localUser.role, localUser.displayName, localUser.email),
      image: localUser.avatarUrl ?? undefined,
    });

    // Stream channel IDs can't contain ":" (it rejects the request).
    const channelId = `order-${order.id}`;
    const channel = server.channel("messaging", channelId, {
      name: `Support · order ${order.id.slice(0, 8)}`,
      created_by_id: customerSid,
    });

    await channel.create();
    await channel.addMembers([customerSid, staffStreamUserId]);

    const joinUrl = `${env.FRONTEND_URL.replace(/\/+$/, "")}/orders/${order.id}/call`;

    await channel.sendMessage({
      text: `Video call — tap Join below (same link for everyone): ${joinUrl}`,
      user_id: staffStreamUserId,
      custom: {
        video_invite: true,
        join_url: joinUrl,
      },
    });

    res.json({ ok: true, joinUrl });
  } catch (e) {
    next(e);
  }
}

const updateOrderStatusSchema = z.object({
  status: z.enum(MANUAL_STATUSES),
  note: z.string().trim().min(1).max(500).optional(),
});

// Admin-only manual status change (mounted under adminRouter's requireAdmin).
// "refunded" here is bookkeeping only — it does not call Polar's refund API.
export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = updateOrderStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid status", details: parsed.error.flatten() });
      return;
    }

    const actingUser = await getLocalUser(userId);
    if (!actingUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id as string)).limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const { status: toStatus, note } = parsed.data;
    if (!canTransition(order.status, toStatus)) {
      res.status(409).json({ error: `Cannot move an order from "${order.status}" to "${toStatus}"` });
      return;
    }

    const [updated] = await db.transaction(async (tx) => {
      // Acting on the order (any way) resolves any pending customer request.
      const rows = await tx
        .update(orders)
        .set({
          status: toStatus,
          updatedAt: new Date(),
          requestedStatus: null,
          requestedNote: null,
          requestedAt: null,
        })
        .where(eq(orders.id, order.id))
        .returning();

      await tx.insert(orderStatusEvents).values({
        orderId: order.id,
        fromStatus: order.status,
        toStatus,
        note: note ?? null,
        changedByUserId: actingUser.id,
      });

      return rows;
    });

    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
}

const requestOrderActionSchema = z.object({
  status: z.enum(REQUESTABLE_STATUSES),
  note: z.string().trim().min(1).max(500).optional(),
});

// Customer-only: flags an order for staff review instead of changing its
// status directly. Gated by the same canTransition() rules as the admin
// endpoint, so a request is never possible where a direct change wouldn't be.
export async function requestOrderAction(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = requestOrderActionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id as string)).limit(1);
    if (!order || order.userId !== localUser.id) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const { status: requestedStatus, note } = parsed.data;
    if (!canTransition(order.status, requestedStatus)) {
      res.status(409).json({ error: `Cannot request "${requestedStatus}" from "${order.status}"` });
      return;
    }

    await db
      .update(orders)
      .set({ requestedStatus, requestedNote: note ?? null, requestedAt: new Date() })
      .where(eq(orders.id, order.id));

    const staffRows = await db.select({ id: users.id }).from(users).where(inArray(users.role, ["admin", "support"]));
    if (staffRows.length > 0) {
      await db.insert(notifications).values(
        staffRows.map((s) => ({
          userId: s.id,
          orderId: order.id,
          message: `Customer requested "${requestedStatus}" for order #${order.id.slice(0, 8)}`,
        })),
      );
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// Admin-only: clears a pending customer request without changing status.
export async function dismissOrderRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const [updated] = await db
      .update(orders)
      .set({ requestedStatus: null, requestedNote: null, requestedAt: null })
      .where(eq(orders.id, req.params.id as string))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
}