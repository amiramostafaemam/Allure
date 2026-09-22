import { describe, expect, it } from "vitest";
import { clerkUserIdFromStreamId, groupNotificationsByOrder, messagePreview, orderIdFromChannelId } from "./notifications";

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

describe("groupNotificationsByOrder", () => {
  function row(overrides: Partial<{ id: string; orderId: string; message: string; read: boolean; createdAt: Date }>) {
    return { id: "id", orderId: "order", message: "msg", read: false, createdAt: new Date(), ...overrides };
  }

  it("collapses multiple rows for the same order into one group, keeping the newest message", () => {
    const rows = [
      row({ id: "3", orderId: "A", message: "third", createdAt: new Date(3) }),
      row({ id: "2", orderId: "A", message: "second", createdAt: new Date(2) }),
      row({ id: "1", orderId: "A", message: "first", createdAt: new Date(1) }),
    ];
    const groups = groupNotificationsByOrder(rows);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ orderId: "A", message: "third", count: 3, ids: ["3", "2", "1"] });
  });

  it("keeps separate orders as separate groups, preserving input order", () => {
    const rows = [row({ id: "1", orderId: "B" }), row({ id: "2", orderId: "A" })];
    const groups = groupNotificationsByOrder(rows);
    expect(groups.map((g) => g.orderId)).toEqual(["B", "A"]);
  });

  it("a group is read only if every row in it is read", () => {
    const rows = [
      row({ id: "1", orderId: "A", read: true }),
      row({ id: "2", orderId: "A", read: false }),
    ];
    expect(groupNotificationsByOrder(rows)[0].read).toBe(false);

    const allRead = [row({ id: "1", orderId: "A", read: true }), row({ id: "2", orderId: "A", read: true })];
    expect(groupNotificationsByOrder(allRead)[0].read).toBe(true);
  });
});
