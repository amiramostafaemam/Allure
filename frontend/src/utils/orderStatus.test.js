import { describe, expect, it } from "vitest";
import { isChatEligible, nextStatusOptions, requestableStatusOptions, statusBadgeClass } from "./orderStatus";

describe("statusBadgeClass", () => {
  it("maps known statuses to their badge class", () => {
    expect(statusBadgeClass("pending")).toBe("badge-warning");
    expect(statusBadgeClass("paid")).toBe("badge-success");
    expect(statusBadgeClass("shipped")).toBe("badge-info");
    expect(statusBadgeClass("delivered")).toBe("badge-success");
    expect(statusBadgeClass("failed")).toBe("badge-error");
    expect(statusBadgeClass("cancelled")).toBe("badge-error");
    expect(statusBadgeClass("refunded")).toBe("badge-ghost");
  });

  it("falls back to badge-ghost for unknown statuses", () => {
    expect(statusBadgeClass("something-else")).toBe("badge-ghost");
    expect(statusBadgeClass(undefined)).toBe("badge-ghost");
  });
});

describe("nextStatusOptions", () => {
  it("returns the manual transitions available from a status", () => {
    expect(nextStatusOptions("paid")).toEqual(["shipped", "cancelled", "refunded"]);
    expect(nextStatusOptions("shipped")).toEqual(["delivered", "refunded"]);
    expect(nextStatusOptions("delivered")).toEqual(["refunded"]);
  });

  it("returns an empty array for terminal/webhook-only statuses", () => {
    expect(nextStatusOptions("pending")).toEqual([]);
    expect(nextStatusOptions("cancelled")).toEqual([]);
    expect(nextStatusOptions(undefined)).toEqual([]);
  });
});

describe("requestableStatusOptions", () => {
  it("excludes shipped/delivered from paid's transitions, keeping cancel/refund", () => {
    expect(requestableStatusOptions("paid")).toEqual(["cancelled", "refunded"]);
  });

  it("only offers refunded from shipped/delivered", () => {
    expect(requestableStatusOptions("shipped")).toEqual(["refunded"]);
    expect(requestableStatusOptions("delivered")).toEqual(["refunded"]);
  });

  it("is empty for terminal statuses", () => {
    expect(requestableStatusOptions("cancelled")).toEqual([]);
    expect(requestableStatusOptions("refunded")).toEqual([]);
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
