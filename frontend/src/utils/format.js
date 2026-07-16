// export function formatPrice(pounds, currency) {
//   return new Intl.NumberFormat("en-EG", {
//     style: "currency",
//     currency: (currency ?? "egp").toUpperCase(),
//   }).format(pounds);
// }

// export function formatOrderWhen(iso, opts = {}) {
//   const { dateStyle = "medium" } = opts;
//   if (!iso) return "";

//   const date = new Date(iso);
//   if (Number.isNaN(date.getTime())) return "";

//   return new Intl.DateTimeFormat("en-EG", {
//     dateStyle,
//     timeStyle: "short",
//   }).format(date);
// }
export function formatPrice(pounds, currency) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: (currency ?? "egp").toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pounds);
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
