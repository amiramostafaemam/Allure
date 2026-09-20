import { describe, expect, it } from "vitest";
import { isAdmin, isStaff, parseRole } from "./roles";

describe("parseRole", () => {
  it("accepts known roles", () => {
    expect(parseRole("admin")).toBe("admin");
    expect(parseRole("support")).toBe("support");
    expect(parseRole("customer")).toBe("customer");
  });

  it("falls back to customer for unknown or invalid values", () => {
    expect(parseRole("superadmin")).toBe("customer");
    expect(parseRole(undefined)).toBe("customer");
    expect(parseRole(42)).toBe("customer");
  });
});

describe("isAdmin", () => {
  it("is true only for admin", () => {
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("support")).toBe(false);
    expect(isAdmin("customer")).toBe(false);
  });
});

describe("isStaff", () => {
  it("is true for support and admin, false for customer", () => {
    expect(isStaff("admin")).toBe(true);
    expect(isStaff("support")).toBe(true);
    expect(isStaff("customer")).toBe(false);
  });
});
