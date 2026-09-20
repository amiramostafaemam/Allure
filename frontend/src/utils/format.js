export function formatPrice(pounds, currency) {
  if (pounds === null || pounds === undefined) return "—";
  const amount = Number(pounds);
  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: (currency ?? "egp").toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatOrderWhen(iso, opts = {}) {
  const { dateStyle = "medium" } = opts;
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-EG", {
    dateStyle,
    timeStyle: "short",
  }).format(date);
}
