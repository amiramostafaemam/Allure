import { describe, expect, it } from "vitest";
import { applyPromoCode } from "./promoCodes";

describe("applyPromoCode", () => {
  it("computes a straightforward percentage discount", () => {
    expect(applyPromoCode(200, 10)).toEqual({ discountPounds: 20, totalPounds: 180 });
  });

  it("rounds the discount to the nearest whole pound", () => {
    expect(applyPromoCode(99, 10)).toEqual({ discountPounds: 10, totalPounds: 89 });
  });

  it("caps the discount so the total never drops below the £50 Polar minimum", () => {
    // 100% off a 60-pound cart would be 0, but it's capped at a 10-pound
    // discount so the charged total stays at the 50-pound floor.
    expect(applyPromoCode(60, 100)).toEqual({ discountPounds: 10, totalPounds: 50 });
  });

  it("never discounts below zero even if the subtotal is already under the floor", () => {
    expect(applyPromoCode(40, 50)).toEqual({ discountPounds: 0, totalPounds: 40 });
  });
});
