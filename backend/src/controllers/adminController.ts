import type{Request,Response,NextFunction} from 'express';
import {getAuth} from '@clerk/express';
import {getLocalUser} from '../lib/users';
import { isAdmin } from '../lib/roles';
import ImageKit from '@imagekit/nodejs';
import { getEnv } from '../lib/env';
import { db } from '../db';
import { categories, orderItems, products } from '../db/schema';
import { count, desc, eq, ilike } from 'drizzle-orm';
import {z} from 'zod';
import { deleteImageKitAsset } from '../lib/imagekit';
import { parsePagination } from '../lib/pagination';
import { isUniqueViolation } from '../lib/dbErrors';

const env=getEnv();

const productCreate=z.object({
    slug:z.string().min(1),
    name:z.string().min(1),
    category:z.string().min(1),
    description:z.string().default(""),
    pricePounds:z.number().int().positive(),
    currency:z.string().min(1).default("egp"),
    // null/omitted = untracked, unlimited stock
    stockQuantity:z.number().int().min(0).max(1_000_000).nullable().optional(),
    imageUrl:z.union([z.string().url(),z.literal("")]).optional().nullable(),
    imageKitFileId:z.union([z.string().min(1),z.literal(""),z.null()]).optional(),
    active:z.boolean().default(true),
    
})

const productPatch=productCreate.partial();

function buildProductUpdateSet(body: z.infer<typeof productPatch>) {
  const data: Partial<typeof products.$inferInsert> = {};
  if (body.slug !== undefined) data.slug = body.slug;
  if (body.name !== undefined) data.name = body.name;
  if (body.category !== undefined) data.category = body.category;
  if (body.description !== undefined) data.description = body.description;
  if (body.pricePounds !== undefined) data.pricePounds = body.pricePounds;
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.stockQuantity !== undefined) data.stockQuantity = body.stockQuantity;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl === "" ? null : body.imageUrl;
  if (body.imageKitFileId !== undefined) {
    data.imageKitFileId = body.imageKitFileId === "" ? null : body.imageKitFileId;
  }
  if (body.active !== undefined) data.active = body.active;
  return data;
}

export async function requireAdmin(req:Request,res:Response,next:NextFunction){
    try{
        const {userId, isAuthenticated}=getAuth(req);
        if(!isAuthenticated||!userId){res.status(401).json({error:"Unauthorized"})
        return;
     }
        
        const user=await getLocalUser(userId);

        if(!user||!isAdmin(user.role)){res.status(403).json({error:"Forbidden Access : Admin only"})
        return;
    }
        
        next();
    }catch(err){
        next(err);
    }
}

export function getImageKitAuth(_req:Request,res:Response,next:NextFunction){
    try{
        const client=new ImageKit({
            privateKey:env.IMAGEKIT_PRIVATE_KEY
        });

        const auth =client.helper.getAuthenticationParameters();

        res.json({
            ...auth,
            publicKey:env.IMAGEKIT_PUBLIC_KEY,urlEndPoint:env.IMAGEKIT_URL_ENDPOINT});

        
    }catch(err){
        next(err);
    }
}

export async function listAdminProducts(req:Request,res:Response,next:NextFunction){
    try{
        const {limit,offset}=parsePagination(req);
        const q=typeof req.query.q==="string" ? req.query.q.trim() : "";
        const whereClause=q ? ilike(products.name,`%${q}%`) : undefined;

        const [rows,[totalRow]]=await Promise.all([
            db.select().from(products).where(whereClause).orderBy(desc(products.createdAt)).limit(limit).offset(offset),
            db.select({c:count()}).from(products).where(whereClause),
        ]);

        res.json({products:rows,total:Number(totalRow?.c ?? 0),limit,offset});

    }catch(err){
        next(err);
    }
}

async function categoryExists(name: string): Promise<boolean> {
    const [row] = await db.select({ id: categories.id }).from(categories).where(eq(categories.name, name)).limit(1);
    return Boolean(row);
}

export async function createAdminProduct(req:Request,res:Response,next:NextFunction){
    try{
        const parsed=productCreate.safeParse(req.body);

        if(!parsed.success){
            res.status(400).json({error:"Invalid product",details:parsed.error.flatten()});
            return;
        }

        if(!(await categoryExists(parsed.data.category))){
            res.status(400).json({error:`Unknown category "${parsed.data.category}"`});
            return;
        }

        const {imageUrl,imageKitFileId,...rest}=parsed.data;

        const [row]=await db.insert(products).values({
            ...rest,
            imageUrl:imageUrl || null,
            imageKitFileId:imageKitFileId || null
        }).returning();

        res.status(201).json({product:row});

    }catch(err){
        if(isUniqueViolation(err)){
            res.status(409).json({error:"A product with this slug already exists"});
            return;
        }
        next(err);
    }
}

export async function updateAdminProduct(req:Request,res:Response,next:NextFunction){
    try{
        const parsed=productPatch.safeParse(req.body);

        if(!parsed.success){
            res.status(400).json({error:"Invalid product",details:parsed.error.flatten()});
            return;
        }

        if(parsed.data.category!==undefined && !(await categoryExists(parsed.data.category))){
            res.status(400).json({error:`Unknown category "${parsed.data.category}"`});
            return;
        }

        const data=buildProductUpdateSet(parsed.data)

        if(Object.keys(data).length===0){
            res.status(400).json({error:"No fields to update"});
            return;
        }

        const [row]=await db.update(products).set(data).where(eq(products.id,req.params.id as string)).returning();

        if(!row){
            res.status(404).json({error:"Product not found"});
            return;
        }

        res.json({product:row});

    }catch(err){
        if(isUniqueViolation(err)){
            res.status(409).json({error:"A product with this slug already exists"});
            return;
        }
        next(err);
    }
}

export async function deleteAdminProduct(req:Request,res:Response,next:NextFunction){
    try{
        const id=req.params.id as string;
        const [existing]=await db.select().from(products).where(eq(products.id,id)).limit(1);

        if(!existing){
            res.status(404).json({error:"Product not found"});
            return;
        }
        // check if there are any orders for this product to deactivate it
        const [countRow]=await db.select({c:count()}).from(orderItems).where(eq(orderItems.productId,id));

        if(Number(countRow?.c ?? 0)>0){
            res.status(409).json({error:"This product is on one or more orders and cannot be deleted. Deactivate it instead."});
            return;
        }

        await deleteImageKitAsset(env,existing.imageKitFileId);
        await db.delete(products).where(eq(products.id,id));
        res.status(204).end();

    }catch(err){
        next(err);
    }
}