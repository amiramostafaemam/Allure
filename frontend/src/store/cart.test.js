import { beforeEach, describe, expect, it } from "vitest";
import { useCart } from "./cart";

beforeEach(() => {
  useCart.getState().clear();
});

describe("cart store", () => {
  it("adds a new item", () => {
    useCart.getState().addItem("p1", 2);
    expect(useCart.getState().items).toEqual([{ productId: "p1", quantity: 2 }]);
  });

  it("merges quantity when adding an existing item", () => {
    useCart.getState().addItem("p1", 2);
    useCart.getState().addItem("p1", 3);
    expect(useCart.getState().items).toEqual([{ productId: "p1", quantity: 5 }]);
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
    expect(useCart.getState().items).toEqual([{ productId: "p2", quantity: 1 }]);
  });

  it("caps quantity at 99, whether via repeated addItem or setQty", () => {
    useCart.getState().addItem("p1", 60);
    useCart.getState().addItem("p1", 60);
    expect(useCart.getState().items).toEqual([{ productId: "p1", quantity: 99 }]);

    useCart.getState().setQty("p1", 500);
    expect(useCart.getState().items).toEqual([{ productId: "p1", quantity: 99 }]);
  });
});
