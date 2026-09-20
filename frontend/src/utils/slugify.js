// Deterministic fallback hash so non-Latin names (e.g. Arabic product names)
// still get a stable, unique, non-empty slug instead of "".
function hashToBase36(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

export function slugify(text) {
  const base = text
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (base) return base;

  const source = text.toString().trim();
  return source ? `product-${hashToBase36(source)}` : "";
}
