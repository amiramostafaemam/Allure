import { beforeEach, describe, expect, it } from "vitest";
import { useCart } from "./cart";

beforeEach(() => {
  useCart.getState().clear();
});

describe("cart store", () => {
  it("adds a new item", () => {
    useCart.getState().addItem("p1", 2);
    expect(useCart.getState().items).toEqual([{ productId: "p1", variantId: null, quantity: 2 }]);
  });

  it("merges quantity when adding an existing item", () => {
    useCart.getState().addItem("p1", 2);
    useCart.getState().addItem("p1", 3);
    expect(useCart.getState().items).toEqual([{ productId: "p1", variantId: null, quantity: 5 }]);
  });

  it("removes an item on setQty(0) or below", () => {
    useCart.getState().addItem("p1", 2);
    useCart.getState().setQty("p1", 0);
    expect(useCart.getState().items).toEqual([]);
  });

  it("removeItem drops only the matching product", () => {
    useCart.getState().addItem("p1", 1);
    useCart.getState().addItem("p2", 1);
    useCart.getState().removeItem("p1");
    expect(useCart.getState().items).toEqual([{ productId: "p2", variantId: null, quantity: 1 }]);
  });

  it("caps quantity at 99, whether via repeated addItem or setQty", () => {
    useCart.getState().addItem("p1", 60);
    useCart.getState().addItem("p1", 60);
    expect(useCart.getState().items).toEqual([{ productId: "p1", variantId: null, quantity: 99 }]);

    useCart.getState().setQty("p1", 500);
    expect(useCart.getState().items).toEqual([{ productId: "p1", variantId: null, quantity: 99 }]);
  });

  it("treats different variants of the same product as separate lines", () => {
    useCart.getState().addItem("shirt", 1, "size-m");
    useCart.getState().addItem("shirt", 1, "size-l");
    expect(useCart.getState().items).toEqual([
      { productId: "shirt", variantId: "size-m", quantity: 1 },
      { productId: "shirt", variantId: "size-l", quantity: 1 },
    ]);

    useCart.getState().addItem("shirt", 2, "size-m");
    expect(useCart.getState().items).toEqual([
      { productId: "shirt", variantId: "size-m", quantity: 3 },
      { productId: "shirt", variantId: "size-l", quantity: 1 },
    ]);
  });

  it("setQty/removeItem with a variantId only touch that line", () => {
    useCart.getState().addItem("shirt", 1, "size-m");
    useCart.getState().addItem("shirt", 1, "size-l");

    useCart.getState().setQty("shirt", 5, "size-m");
    expect(useCart.getState().items).toEqual([
      { productId: "shirt", variantId: "size-m", quantity: 5 },
      { productId: "shirt", variantId: "size-l", quantity: 1 },
    ]);

    useCart.getState().removeItem("shirt", "size-m");
    expect(useCart.getState().items).toEqual([{ productId: "shirt", variantId: "size-l", quantity: 1 }]);
  });
});
