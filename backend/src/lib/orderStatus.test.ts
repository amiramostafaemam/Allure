import { describe, expect, it } from "vitest";
import { canTransition, formatOrderNumber, isChatEligible, orderStatusChangeMessage } from "./orderStatus";

describe("canTransition", () => {
  it("allows the documented paid → shipped/cancelled/refunded transitions", () => {
    expect(canTransition("paid", "shipped")).toBe(true);
    expect(canTransition("paid", "cancelled")).toBe(true);
    expect(canTransition("paid", "refunded")).toBe(true);
  });

  it("allows shipped → delivered/refunded", () => {
    expect(canTransition("shipped", "delivered")).toBe(true);
    expect(canTransition("shipped", "refunded")).toBe(true);
  });

  it("allows delivered → refunded only", () => {
    expect(canTransition("delivered", "refunded")).toBe(true);
    expect(canTransition("delivered", "shipped")).toBe(false);
  });

  it("rejects moving backwards or skipping steps", () => {
    expect(canTransition("shipped", "paid")).toBe(false);
    expect(canTransition("paid", "delivered")).toBe(false);
  });

  it("treats pending/failed/cancelled/refunded as terminal (no manual transitions out)", () => {
    expect(canTransition("pending", "paid")).toBe(false);
    expect(canTransition("failed", "pending")).toBe(false);
    expect(canTransition("cancelled", "paid")).toBe(false);
    expect(canTransition("refunded", "paid")).toBe(false);
  });
});

describe("isChatEligible", () => {
  it("is true for paid, shipped, and delivered", () => {
    expect(isChatEligible("paid")).toBe(true);
    expect(isChatEligible("shipped")).toBe(true);
    expect(isChatEligible("delivered")).toBe(true);
  });

  it("is false for pending, failed, cancelled, refunded", () => {
    expect(isChatEligible("pending")).toBe(false);
    expect(isChatEligible("failed")).toBe(false);
    expect(isChatEligible("cancelled")).toBe(false);
    expect(isChatEligible("refunded")).toBe(false);
  });
});

describe("formatOrderNumber", () => {
  it("offsets the raw identity value by 1000", () => {
    expect(formatOrderNumber(1)).toBe("1001");
    expect(formatOrderNumber(42)).toBe("1042");
  });
});

describe("orderStatusChangeMessage", () => {
  it("returns known human copy for shipped/delivered/cancelled/refunded", () => {
    expect(orderStatusChangeMessage("shipped")).toMatch(/on its way/i);
    expect(orderStatusChangeMessage("delivered")).toMatch(/delivered/i);
    expect(orderStatusChangeMessage("cancelled")).toMatch(/cancelled/i);
    expect(orderStatusChangeMessage("refunded")).toMatch(/refunded/i);
  });

  it("falls back to a generic message for any other status", () => {
    expect(orderStatusChangeMessage("paid")).toBe("Your order status changed to paid.");
  });
});
