import type { CheckoutSessionLine } from "../db/schema";

export type CartLine = {
  productId: string;
  quantity: number;
  variantId?: string;
  variantLabel?: string;
};
export type PriceableProduct = { id: string; pricePounds: number };

export function computeCheckoutTotal(
  items: CartLine[],
  productsById: Map<string, PriceableProduct>,
): { totalPounds: number; lines: CheckoutSessionLine[] } {
  let totalPounds = 0;
  const lines: CheckoutSessionLine[] = [];

  for (const item of items) {
    const product = productsById.get(item.productId);
    if (!product) {
      throw new Error(`Unknown product: ${item.productId}`);
    }
    totalPounds += product.pricePounds * item.quantity;
    lines.push({
      productId: product.id,
      quantity: item.quantity,
      unitPricePounds: product.pricePounds,
      ...(item.variantId ? { variantId: item.variantId } : {}),
      ...(item.variantLabel ? { variantLabel: item.variantLabel } : {}),
    });
  }

  return { totalPounds, lines };
}
