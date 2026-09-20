import { describe, expect, it } from "vitest";
import { formatPrice, formatOrderWhen } from "./format";

describe("formatPrice", () => {
  it("formats whole EGP amounts with no decimals", () => {
    expect(formatPrice(1250, "egp")).toContain("1,250");
  });

  it("defaults to EGP when no currency is given", () => {
    expect(() => formatPrice(100)).not.toThrow();
  });

  it("degrades gracefully for null/undefined/NaN instead of throwing", () => {
    expect(formatPrice(null, "egp")).toBe("—");
    expect(formatPrice(undefined, "egp")).toBe("—");
    expect(formatPrice(Number.NaN, "egp")).toBe("—");
  });
});

describe("formatOrderWhen", () => {
  it("returns an empty string for missing input", () => {
    expect(formatOrderWhen(null)).toBe("");
    expect(formatOrderWhen(undefined)).toBe("");
  });

  it("returns an empty string for an invalid date string", () => {
    expect(formatOrderWhen("not-a-date")).toBe("");
  });

  it("formats a valid ISO date string", () => {
    expect(formatOrderWhen("2026-01-15T10:00:00.000Z")).not.toBe("");
  });
});
