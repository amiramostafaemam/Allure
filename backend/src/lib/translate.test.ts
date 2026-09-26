import { describe, expect, it } from "vitest";
import { isArabicText, resolveBilingualField } from "./translate";
import type { Env } from "./env";

// No ANTHROPIC_API_KEY — exercises the exact "key not configured" path a
// fresh deployment starts in, without needing to mock a network call.
const envWithoutKey = { ANTHROPIC_API_KEY: undefined } as Env;

describe("isArabicText", () => {
  it("detects Arabic script", () => {
    expect(isArabicText("حذاء جلدي")).toBe(true);
  });

  it("returns false for English/Latin text", () => {
    expect(isArabicText("Leather Boots")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isArabicText("")).toBe(false);
  });

  it("detects Arabic even mixed with Latin characters or digits", () => {
    expect(isArabicText("Size 44 — مقاس")).toBe(true);
  });
});

describe("resolveBilingualField", () => {
  it("keeps English input verbatim and leaves Arabic null when translation is unavailable", async () => {
    const result = await resolveBilingualField(envWithoutKey, "Leather Boots");
    expect(result).toEqual({ en: "Leather Boots", ar: null });
  });

  it("falls back to a verbatim copy on the English side when blocked and fallback is requested", async () => {
    const result = await resolveBilingualField(envWithoutKey, "حذاء جلدي", {
      fallbackToSourceIfBlocked: true,
    });
    expect(result).toEqual({ en: "حذاء جلدي", ar: "حذاء جلدي" });
  });

  it("leaves English blank (not a fallback copy) when blocked and fallback isn't requested", async () => {
    const result = await resolveBilingualField(envWithoutKey, "حذاء جلدي");
    expect(result).toEqual({ en: "", ar: "حذاء جلدي" });
  });

  it("treats blank/whitespace-only input as empty regardless of the key", async () => {
    const result = await resolveBilingualField(envWithoutKey, "   ");
    expect(result).toEqual({ en: "", ar: null });
  });
});
