export const STATUS_BADGE = {
  pending: "badge-warning",
  paid: "badge-success",
  shipped: "badge-info",
  delivered: "badge-success",
  failed: "badge-error",
  cancelled: "badge-error",
  refunded: "badge-ghost",
};

export function statusBadgeClass(status) {
  return STATUS_BADGE[status] ?? "badge-ghost";
}

// Mirrors backend/src/lib/orderStatus.ts's ALLOWED_TRANSITIONS — kept as a
// small duplicated constant (not fetched) since it drives which buttons the
// admin UI offers; the backend is still the source of truth and rejects
// anything invalid with a 409.
export const MANUAL_TRANSITIONS = {
  paid: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  pending: [],
  failed: [],
  cancelled: [],
  refunded: [],
};

export function nextStatusOptions(status) {
  return MANUAL_TRANSITIONS[status] ?? [];
}

// Mirrors backend/src/lib/orderStatus.ts's REQUESTABLE_STATUSES — the subset
// of nextStatusOptions() a customer may request instead of staff setting
// directly.
const REQUESTABLE_STATUSES = new Set(["cancelled", "refunded"]);

export function requestableStatusOptions(status) {
  return nextStatusOptions(status).filter((s) => REQUESTABLE_STATUSES.has(s));
}

// Mirrors backend/src/lib/orderStatus.ts's CHAT_ELIGIBLE_STATUSES.
const CHAT_ELIGIBLE_STATUSES = ["paid", "shipped", "delivered"];

export function isChatEligible(status) {
  return CHAT_ELIGIBLE_STATUSES.includes(status);
}
