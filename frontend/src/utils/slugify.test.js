import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and dashes ordinary text", () => {
    expect(slugify("Wireless Headphones")).toBe("wireless-headphones");
  });

  it("trims leading/trailing separators and collapses repeats", () => {
    expect(slugify("  --Cool   Product!!--  ")).toBe("cool-product");
  });

  it("strips accents to their base Latin letter", () => {
    expect(slugify("Café Déluxe")).toBe("cafe-deluxe");
  });

  it("never returns an empty string for non-empty input", () => {
    const result = slugify("سماعات لاسلكية");
    expect(result).not.toBe("");
    expect(result).toMatch(/^product-[a-z0-9]+$/);
  });

  it("is deterministic for the same non-Latin input", () => {
    expect(slugify("سماعات لاسلكية")).toBe(slugify("سماعات لاسلكية"));
  });

  it("returns an empty string only for empty input", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
  });
});
