import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and dashes ordinary text", () => {
    expect(slugify("Wireless Headphones")).toBe("wireless-headphones");
  });

  it("never returns an empty string for non-empty non-Latin input", () => {
    const result = slugify("سماعات لاسلكية");
    expect(result).not.toBe("");
    expect(result).toMatch(/^category-[a-z0-9]+$/);
  });

  it("returns an empty string only for empty input", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
  });
});
