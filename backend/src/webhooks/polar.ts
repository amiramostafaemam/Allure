import type { Request,Response} from "express";
import { getEnv } from "../lib/env";
import {checkoutSessions, orders, orderItems, users, products, productVariants} from "../db/schema";
import {and, eq, isNotNull, sql} from "drizzle-orm";
import {db} from "../db/index";
import {Webhook} from "standardwebhooks"
import { sendOrderConfirmationEmail } from "../lib/email";

function headerString(headers:Request["headers"],name:string){
    const value=headers[name];
    return Array.isArray(value)?value[0]:value;
}

function checkoutSessionIdFromMetadata(order: Record<string, unknown>) {
  const metadata = order.metadata;
  if (!metadata || typeof metadata !== "object") return undefined;
  const sessionId = (metadata as Record<string, unknown>).checkout_session_id;
  return typeof sessionId === "string" ? sessionId : undefined;
}

// Checks whether an order already exists for this Polar order/checkout —
// i.e. this webhook delivery is a duplicate. Deliberately checks existence,
// not `status === "paid"`: once an order's status can move on (shipped,
// refunded, ...), a redelivered webhook must still short-circuit here rather
// than trying to re-fulfill an already-deleted checkout session.
async function orderAlreadyFulfilled(polarOrderId?: string, checkoutId?: string) {
  if (polarOrderId) {
    const [row] = await db
      .select()
      .from(orders)
      .where(eq(orders.polarOrderId, polarOrderId))
      .limit(1);
    if (row) return true;
  }
  if (checkoutId) {
    const [row] = await db
      .select()
      .from(orders)
      .where(eq(orders.polarCheckoutId, checkoutId))
      .limit(1);
    if (row) return true;
  }
  return false;
}

async function fulfillCheckoutSession(
  sessionId: string,
  polarOrderId: string | undefined,
  checkoutId: string | undefined,
) {
  return await db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.id, sessionId))
      .for("update");

    if (!session) return null;

    const [order] = await tx
      .insert(orders)
      .values({
        userId: session.userId,
        status: "paid",
        totalPounds: session.totalPounds,
        polarCheckoutId: checkoutId ?? session.polarCheckoutId ?? null,
        shippingAddress: session.shippingAddress ?? null,
        promoCode: session.promoCode ?? null,
        discountPounds: session.discountPounds,
        ...(polarOrderId ? { polarOrderId } : {}),
      })
      .returning();

    if (session.lines.length) {
      await tx.insert(orderItems).values(
        session.lines.map((line) => ({
          orderId: order.id,
          productId: line.productId,
          variantId: line.variantId ?? null,
          variantLabel: line.variantLabel ?? null,
          quantity: line.quantity,
          unitPricePounds: line.unitPricePounds,
        })),
      );

      // A single UPDATE referencing the column's current value is atomic per
      // row in Postgres even without an explicit row lock, so concurrent
      // fulfillments can't oversell each other. Only touches rows where
      // stock is actually tracked (isNotNull) — untracked rows stay
      // unlimited. Clamped at 0 as a defensive floor: createCheckout already
      // rejects an order that exceeds available stock, but stock can still
      // legitimately drop between checkout-session creation and payment
      // (another order fulfilling first), so this must never go negative.
      // A line with a variantId decrements that variant's own stock, not
      // the parent product's (which isn't tracked once a product has
      // variants at all).
      for (const line of session.lines) {
        if (line.variantId) {
          await tx
            .update(productVariants)
            .set({ stockQuantity: sql`greatest(${productVariants.stockQuantity} - ${line.quantity}, 0)` })
            .where(and(eq(productVariants.id, line.variantId), isNotNull(productVariants.stockQuantity)));
        } else {
          await tx
            .update(products)
            .set({ stockQuantity: sql`greatest(${products.stockQuantity} - ${line.quantity}, 0)` })
            .where(and(eq(products.id, line.productId), isNotNull(products.stockQuantity)));
        }
      }
    }

    await tx.delete(checkoutSessions).where(eq(checkoutSessions.id, sessionId));

    const [customer] = await tx.select({ email: users.email }).from(users).where(eq(users.id, session.userId)).limit(1);

    return { order, lines: session.lines, customerEmail: customer?.email };
  });
}


export async function polarWebhookHandler(req:Request,res:Response){

    const env=getEnv();
    try{
        if(!env.POLAR_WEBHOOK_SECRET){
            res.status(503).send("Polar webhooks not configured");
            return;
        }

        const raw=req.body instanceof Buffer ? req.body:Buffer.from(String(req.body));
        
        // POLAR_WEBHOOK_SECRET already comes formatted as "whsec_<base64>" per
        // the Standard Webhooks spec — the Webhook class strips the prefix and
        // base64-decodes the rest itself. Re-encoding it here (as this used to)
        // double-encodes the key and makes every signature check fail.
        const wh =new Webhook(env.POLAR_WEBHOOK_SECRET);

        const id=headerString(req.headers,"webhook-id");
        const ts=headerString(req.headers,"webhook-timestamp");
        const sig=headerString(req.headers,"webhook-signature");

        if(!id || !ts || !sig){
            res.status(400).send("Missing required headers");
            return;
        }

        wh.verify(raw,{"webhook-id":id,"webhook-timestamp":ts,"webhook-signature":sig});

        const event=JSON.parse(raw.toString("utf8")) as {type:string;
            data?:Record<string,unknown>;};

        console.log(`Polar webhook received: ${event.type}`);

        if(event.type==="order.paid"&&event.data){
            const data = event.data;
            const polarOrderId=typeof data.id==="string"?data.id:undefined;
            const checkoutId=typeof data.checkout_id==="string"?data.checkout_id:undefined;

            if(await orderAlreadyFulfilled(polarOrderId,checkoutId)){
                res.json({ok:true , duplicate:true});
                return;
            }

            const sessionId=checkoutSessionIdFromMetadata(data);

            if(!sessionId){
                console.error("Polar order.paid: missing checkout_session_id in metadata",{polarOrderId,checkoutId});
                res.status(400).json({error:"Missing checkout_session_id in metadata"});
                return;
            }

            const fulfillment=await fulfillCheckoutSession(sessionId,polarOrderId,checkoutId);
            if(fulfillment){
                console.log(`Order fulfilled from checkout session ${sessionId} (polar order ${polarOrderId})`);

                if(fulfillment.customerEmail){
                    // Non-blocking — a failed email must never turn a successful
                    // payment into an error response back to Polar.
                    void sendOrderConfirmationEmail(env,{
                        to:fulfillment.customerEmail,
                        orderId:fulfillment.order.id,
                        orderNumber:fulfillment.order.orderNumber,
                        totalPounds:fulfillment.order.totalPounds,
                        lines:fulfillment.lines,
                    });
                }

                res.json({ok:true});
                return;
            }

            if(await orderAlreadyFulfilled(polarOrderId,checkoutId)){
                res.json({ok:true,duplicate:true});
                return;
            }

            console.error("Polar order.paid: could not fulfill checkout session",{sessionId,checkoutId});

            res.status(500).json({error:"Checkout fulfillment failed"})
            return;
        }
        res.json({ok:true});


    } catch(err){
        console.log("Error while processing polar webhook",err);
        res.status(400).json({error:"Invalid webhook"});
    }
}