import { Request, Response } from "express";
import { getEnv } from "../lib/env";
import { verifyWebhook } from "@clerk/backend/webhooks";
import { parseRole } from "../lib/roles";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm/sql/expressions/conditions";

export async function clerkWebhookHandler (req: Request, res: Response) {

    const env = getEnv();
    
     try{
        //webhook verifications needs a shared secret ; without it we can't trust the incoming requests POSTS 
        if (!env.CLERK_WEBHOOK_SECRET) {   
            res.status(503).send("Clerk webhook secret not configured");
            return;  
        }
        //clerk's verifier expects a Web Request with raw body, so we need to use express.raw middleware for this route 
        const payload = req.body instanceof Buffer ? req.body.toString("utf8") : String(req.body);

        const request = new Request("http://internal/webhooks/clerk", {
            method: "POST",
            headers:new Headers(req.headers as HeadersInit),
            body: payload,
        })
        //throws if the signature is wrong or body was tampered with; otherwise returns the parsed event object
        const evt = await verifyWebhook(request,{signingSecret: env.CLERK_WEBHOOK_SECRET});

        //handle the event
        if(evt.type === "user.created" || evt.type === "user.updated"){
            // Process the event
            const user = evt.data;
            const email=user.email_addresses?.find((e) => e.id === user.primary_email_address_id)?.email_address ?? user.email_addresses?.[0]?.email_address;

            if(!email){
                console.error(`User ${evt.type}: ${user.id} has no email address`);
                return res.status(400).json({error:"User has no email address"});
            }

            const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || null;

            const role=parseRole(user.public_metadata?.role);

            await db.insert(users).values({
                clerkUserId: user.id,
                email,
                displayName,
                role
            }).onConflictDoUpdate({target: users.clerkUserId, set:{email, displayName, role ,updatedAt: new Date()}}).execute();
        }

        if(evt.type === "user.deleted"){
            const id=evt.data.id;
            if(id){
                await db.delete(users).where(eq(users.clerkUserId, id))

            }
        }
        res.json({ok:true})
     }
     catch(err){

        //bad signature , malformed payload ,or BD error - do not leak details to the client, but log them for debugging
        console.log("Clerk webhook error:", err);
        res.status(400).json({error:"Invalid webhook event"});
        
     }
}