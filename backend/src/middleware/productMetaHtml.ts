import type { Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import { db } from "../db";
import { products } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { getEnv } from "../lib/env";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

// A crawler generating a link preview (WhatsApp, Twitter, Facebook, ...)
// reads the raw HTML response and never runs the SPA's JS, so the generic
// title/description/image baked into index.html is all it will ever see on
// a product link — swapping in that product's own values here, before the
// static file handler ever gets a chance to serve the untouched file, is
// the only way a shared product link previews correctly. Serves the same
// index.html shell either way (same empty #root + script tag), so this is
// safe to send to real visitors too — it doesn't change how the SPA boots.
export function productMetaHtml(publicDir: string) {
  const env = getEnv();

  return async (req: Request, res: Response, next: NextFunction) => {
    const indexPath = path.join(publicDir, "index.html");
    if (!fs.existsSync(indexPath)) {
      next();
      return;
    }

    try {
      const slug = req.params.slug as string;
      const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.slug, slug), eq(products.active, true)))
        .limit(1);

      let html = fs.readFileSync(indexPath, "utf8");

      if (product) {
        const title = escapeHtml(`${product.name} · Allure`);
        const description = escapeHtml(
          truncate(product.description || "Curated hardware and workspace tools.", 160),
        );
        const usingOwnPhoto = Boolean(product.imageUrl);
        const image = product.imageUrl || `${env.FRONTEND_URL}/og-image.png`;
        const url = `${env.FRONTEND_URL}/product/${product.slug}`;

        html = html
          .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
          .replace(/<meta name="description" content=".*?"\s*\/>/, `<meta name="description" content="${description}" />`)
          .replace(/<meta property="og:title" content=".*?"\s*\/>/, `<meta property="og:title" content="${title}" />`)
          .replace(
            /<meta property="og:description" content=".*?"\s*\/>/,
            `<meta property="og:description" content="${description}" />`,
          )
          .replace(/<meta property="og:image" content=".*?"\s*\/>/, `<meta property="og:image" content="${image}" />`)
          .replace(/<meta name="twitter:title" content=".*?"\s*\/>/, `<meta name="twitter:title" content="${title}" />`)
          .replace(
            /<meta name="twitter:description" content=".*?"\s*\/>/,
            `<meta name="twitter:description" content="${description}" />`,
          )
          .replace(/<meta name="twitter:image" content=".*?"\s*\/>/, `<meta name="twitter:image" content="${image}" />`)
          .replace("</head>", `    <meta property="og:url" content="${url}" />\n  </head>`);

        // The width/height hints only describe the branded fallback image
        // (2400x1260) — wrong, not just unhelpful, once og:image points at
        // the product's own photo instead, which is some other size we
        // don't know without fetching and decoding it.
        if (usingOwnPhoto) {
          html = html
            .replace(/\s*<meta property="og:image:width" content="\d+"\s*\/>\n?/, "\n")
            .replace(/\s*<meta property="og:image:height" content="\d+"\s*\/>\n?/, "\n");
        }
      }

      res.type("html").send(html);
    } catch (err) {
      next(err);
    }
  };
}
