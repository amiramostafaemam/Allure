import { describe, expect, it } from "vitest";
import { computeCheckoutTotal } from "./pricing";

const productsById = new Map([
  ["p1", { id: "p1", pricePounds: 100 }],
  ["p2", { id: "p2", pricePounds: 250 }],
]);

describe("computeCheckoutTotal", () => {
  it("sums price × quantity across lines", () => {
    const { totalPounds, lines } = computeCheckoutTotal(
      [
        { productId: "p1", quantity: 2 },
        { productId: "p2", quantity: 1 },
      ],
      productsById,
    );

    expect(totalPounds).toBe(100 * 2 + 250);
    expect(lines).toEqual([
      { productId: "p1", quantity: 2, unitPricePounds: 100 },
      { productId: "p2", quantity: 1, unitPricePounds: 250 },
    ]);
  });

  it("returns zero for an empty cart", () => {
    expect(computeCheckoutTotal([], productsById).totalPounds).toBe(0);
  });

  it("throws for a product that isn't in the price map", () => {
    expect(() =>
      computeCheckoutTotal([{ productId: "missing", quantity: 1 }], productsById),
    ).toThrow(/Unknown product/);
  });
});
