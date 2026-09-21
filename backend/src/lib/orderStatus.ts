import type { OrderStatus } from "../db/schema";

// Statuses an admin can set by hand via PATCH /api/admin/orders/:id/status.
// "pending"/"paid"/"failed" are webhook-owned and never set manually.
export const MANUAL_STATUSES = ["shipped", "delivered", "cancelled", "refunded"] as const;
export type ManualOrderStatus = (typeof MANUAL_STATUSES)[number];

// Subset of MANUAL_STATUSES a customer can request (not "shipped"/"delivered"
// — those are operational calls only staff make). Still gated through the
// same canTransition() rules as the admin endpoint.
export const REQUESTABLE_STATUSES = ["cancelled", "refunded"] as const;
export type RequestableOrderStatus = (typeof REQUESTABLE_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: [],
  paid: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  failed: [],
  cancelled: [],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// Statuses under which support/admin can still open chat or send a video
// invite for an order — broader than just "paid" so a shipped/delivered
// order doesn't lose customer support access.
export const CHAT_ELIGIBLE_STATUSES: OrderStatus[] = ["paid", "shipped", "delivered"];

export function isChatEligible(status: OrderStatus): boolean {
  return CHAT_ELIGIBLE_STATUSES.includes(status);
}

// Orders in these statuses count as a "real" purchase — used both for
// realized-revenue stats and to gate who can leave a product review.
export const FULFILLED_STATUSES: OrderStatus[] = ["paid", "shipped", "delivered"];
