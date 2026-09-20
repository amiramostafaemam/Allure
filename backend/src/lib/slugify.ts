// Deterministic fallback hash so non-Latin names still get a stable,
// unique, non-empty slug instead of "". Mirrors frontend/src/utils/slugify.js.
function hashToBase36(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

export function slugify(text: string): string {
  const source = text.toString().trim();
  const base = source
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (base) return base;
  return source ? `category-${hashToBase36(source)}` : "";
}
