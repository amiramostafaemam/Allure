import type { Request, Response , NextFunction } from 'express';
import { productVariants, products } from '../db/schema';
import { asc, desc } from 'drizzle-orm/sql/expressions/select';
import { db } from '../db';
import { and, eq, ilike, inArray } from 'drizzle-orm';

// Small catalog, small per-product variant lists — attaching variants to
// every row here (rather than a separate per-product request) keeps the
// cart page's stock-per-line-item logic simple with no N+1 requests.
async function attachVariants<T extends { id: string }>(rows: T[]) {
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return rows.map((r) => ({ ...r, variants: [] as (typeof productVariants.$inferSelect)[] }));

    const variantRows = await db.select().from(productVariants)
        .where(inArray(productVariants.productId, ids))
        .orderBy(asc(productVariants.sortOrder));

    const byProduct = new Map<string, (typeof productVariants.$inferSelect)[]>();
    for (const v of variantRows) {
        const list = byProduct.get(v.productId) ?? [];
        list.push(v);
        byProduct.set(v.productId, list);
    }

    return rows.map((r) => ({ ...r, variants: byProduct.get(r.id) ?? [] }));
}

export async function listProducts(req:Request,res:Response,next:NextFunction){
    try{
        const category=typeof req.query.category==="string" ? req.query.category.trim():"";
        const q=typeof req.query.q==="string" ? req.query.q.trim():"";

        const conditions=[eq(products.active,true)];
        if(category) conditions.push(eq(products.category,category));
        if(q) conditions.push(ilike(products.name,`%${q}%`));

        const rows=await db.select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.createdAt));

        res.json({products:await attachVariants(rows)});
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

        const variants=await db.select().from(productVariants)
            .where(eq(productVariants.productId,row.id))
            .orderBy(asc(productVariants.sortOrder));

        res.json({product:{...row,variants}});
        
    }catch(err){
        next(err);
    }
}