import { describe, expect, it } from "vitest";
import { clerkUserIdFromStreamId, messagePreview, orderIdFromChannelId } from "./notifications";

describe("clerkUserIdFromStreamId", () => {
  it("strips the clerk_ prefix", () => {
    expect(clerkUserIdFromStreamId("clerk_user_abc123")).toBe("user_abc123");
  });

  it("returns undefined for ids without the prefix", () => {
    expect(clerkUserIdFromStreamId("user_abc123")).toBeUndefined();
  });
});

describe("orderIdFromChannelId", () => {
  it("strips the order- prefix, keeping dashes in the uuid intact", () => {
    expect(orderIdFromChannelId("order-d7413ced-e1cc-45c5-a031-1ed9acdcf20b")).toBe(
      "d7413ced-e1cc-45c5-a031-1ed9acdcf20b",
    );
  });

  it("returns undefined for channel ids without the prefix", () => {
    expect(orderIdFromChannelId("something-else")).toBeUndefined();
  });
});

describe("messagePreview", () => {
  it("trims whitespace", () => {
    expect(messagePreview("  hello  ")).toBe("hello");
  });

  it("falls back to a generic label for empty/undefined text", () => {
    expect(messagePreview("")).toBe("New message");
    expect(messagePreview(undefined)).toBe("New message");
    expect(messagePreview("   ")).toBe("New message");
  });

  it("truncates long messages to 140 chars with an ellipsis", () => {
    const long = "a".repeat(200);
    const result = messagePreview(long);
    expect(result.length).toBe(141);
    expect(result.endsWith("…")).toBe(true);
  });
});
