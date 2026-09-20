import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import "dotenv/config";
import {clerkMiddleware} from '@clerk/express';
import { clerkWebhookHandler } from './webhooks/clerk';
import { getEnv } from './lib/env';
import fs from 'node:fs';
import path from 'node:path';
import * as Sentry from '@sentry/node';
import cronJob from './lib/cron';
import meRoute from './routes/meRouter';
import productRouter from './routes/productRouter';
import streamRouter from './routes/streamRouter';
import checkoutRouter from './routes/checkoutRouter';
import { polarWebhookHandler } from './webhooks/polar';
import { sentryClerkUserMiddleware } from './middleware/sentryClerkUser';
import adminRouter from './routes/adminRouter';
import orderRouter from './routes/orderRouter';

const env = getEnv();
const app = express();

const rawJson=express.raw({type:'application/json',limit:'1mb'});

app.post("/webhooks/clerk",rawJson,(req,res)=>{
   void clerkWebhookHandler(req,res);
});

app.post("/webhooks/polar",rawJson,(req,res)=>{
   void polarWebhookHandler(req,res);
});

// CSP is disabled: the SPA loads scripts/iframes/websockets from Clerk, Sentry,
// Stream and ImageKit, and a default-src 'self' policy would block them without
// a maintained per-vendor allowlist. The other helmet headers still apply.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(clerkMiddleware());
app.use(sentryClerkUserMiddleware);

app.get("/health",(_req,res)=>{
    res.json({ok:true});
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
});

const checkoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use("/api", apiLimiter);

app.use("/api/me",meRoute);
app.use("/api/products",productRouter);
app.use("/api/stream",streamRouter);
app.use("/api/checkout",checkoutLimiter,checkoutRouter);
app.use("/api/admin",adminRouter)
app.use("/api/orders",orderRouter);




const publicDir=path.join(process.cwd(),"public");
if(fs.existsSync(publicDir)){
    app.use(express.static(publicDir));
    app.get(/.*/,(req,res,next)=>{
        if(req.method!=="GET" && req.method!=="HEAD"){
            next();
            return;        
        }

        if(req.path.startsWith("/api") || req.path.startsWith("/webhooks")){
            next();
            return;
        }

        res.sendFile(path.join(publicDir,"index.html"),(err=>next(err)));
    });
}


Sentry.setupExpressErrorHandler(app);
app.use((_err:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
    const sentryId=(res as express.Response & {sentry?:string}).sentry;

    res.status(500).json({error:"Internal server error",...(sentryId!==undefined&&{sentryId}),});
    
})

app.listen(env.PORT,()=>{console.log('Server is running on port '+env.PORT)
    if(env.NODE_ENV==="production"){
        cronJob.start();
    }
    
});