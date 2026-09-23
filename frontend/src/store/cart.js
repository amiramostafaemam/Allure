import { create } from "zustand";
import { persist } from "zustand/middleware";

// Matches the cap the backend enforces at checkout (checkoutController.ts's
// cartItemsSchema) and the stepper's own limit on the product page — kept
// here too so repeatedly clicking "Add" on a catalog card (which has no
// stepper, just +1 per click) can't quietly build an unbounded quantity.
const MAX_QTY = 99;

// persist will save the cart items to localStorage
export const useCart = create(
  persist(
    (set, get) => ({
      items: [],

      addItem(productId, qty = 1) {
        const items = [...get().items];
        const i = items.findIndex((item) => item.productId === productId);
        if (i >= 0) {
          items[i] = {
            ...items[i],
            quantity: Math.min(MAX_QTY, items[i].quantity + qty),
          };
        } else {
          items.push({ productId, quantity: Math.min(MAX_QTY, qty) });
        }
        set({ items });
      },

      removeItem(productId) {
        set({
          items: get().items.filter((item) => item.productId !== productId),
        });
      },

      setQty(productId, quantity) {
        if (quantity <= 0) {
          set({
            items: get().items.filter((item) => item.productId !== productId),
          });
          return;
        }
        const items = get().items.map((item) =>
          item.productId === productId
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
