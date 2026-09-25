import { create } from "zustand";
import { persist } from "zustand/middleware";

// Matches the cap the backend enforces at checkout (checkoutController.ts's
// cartItemsSchema) and the stepper's own limit on the product page — kept
// here too so repeatedly clicking "Add" on a catalog card (which has no
// stepper, just +1 per click) can't quietly build an unbounded quantity.
const MAX_QTY = 99;

// A cart line is identified by productId + variantId together, not productId
// alone — a product with variants (e.g. a shirt in Size M and Size L) needs
// two separate lines. variantId is normalized to null (never undefined) so
// it round-trips through localStorage JSON consistently and non-variant
// items compare equal to themselves after a reload.
function sameLine(item, productId, variantId) {
  return item.productId === productId && (item.variantId ?? null) === (variantId ?? null);
}

// persist will save the cart items to localStorage
export const useCart = create(
  persist(
    (set, get) => ({
      items: [],

      addItem(productId, qty = 1, variantId = null) {
        const items = [...get().items];
        const i = items.findIndex((item) => sameLine(item, productId, variantId));
        if (i >= 0) {
          items[i] = {
            ...items[i],
            quantity: Math.min(MAX_QTY, items[i].quantity + qty),
          };
        } else {
          items.push({ productId, variantId: variantId ?? null, quantity: Math.min(MAX_QTY, qty) });
        }
        set({ items });
      },

      removeItem(productId, variantId = null) {
        set({
          items: get().items.filter((item) => !sameLine(item, productId, variantId)),
        });
      },

      setQty(productId, quantity, variantId = null) {
        if (quantity <= 0) {
          set({
            items: get().items.filter((item) => !sameLine(item, productId, variantId)),
          });
          return;
        }
        const items = get().items.map((item) =>
          sameLine(item, productId, variantId)
            ? { ...item, quantity: Math.min(MAX_QTY, quantity) }
            : item,
        );
        set({ items });
      },

      clear() {
        set({ items: [] });
      },
    }),
    { name: "allure-cart" },
  ),
);
