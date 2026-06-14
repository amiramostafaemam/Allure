import type { Request, Response , NextFunction } from 'express';
import { products } from '../db/schema';
import { desc } from 'drizzle-orm/sql/expressions/select';
import { db } from '../db';
import { and, eq } from 'drizzle-orm';

export async function listProducts(req:Request,res:Response,next:NextFunction){
    try{
        const category=typeof req.query.category==="string" ? req.query.category.trim():"";

        const activeOnly=eq(products.active,true);

        const whereClause=category ? and(activeOnly,eq(products.category,category)) : activeOnly;

        const rows=await db.select()
        .from(products)
        .where(whereClause)
        .orderBy(desc(products.createdAt));
        
        res.json({products:rows});
    }catch(err){
        next(err);
    }
}

export async function getCategories(_req:Request,res:Response,next:NextFunction){
    try{
        const rows=await db.select({category:products.category})
        .from(products)
        .where(eq(products.active,true));
        
        const categories=[...new Set(rows.map((r)=>r.category))].sort((a,b)=>
            a.localeCompare(b));

        res.json({categories});
    }catch(err){
        next(err);
    }
}

export async function getProductBySlug(req:Request,res:Response,next:NextFunction){
    try{
       const [row] = await db.select()
        .from(products)
        .where(eq(products.slug,req.params.slug as string));

        if(!row || !row.active) {return res.status(404).json({error:"Product not found"})}
        res.json({product:row});
        
    }catch(err){
        next(err);
    }
}