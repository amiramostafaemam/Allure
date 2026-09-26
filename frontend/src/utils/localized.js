// Picks the Arabic translation of an admin-entered field when present and
// the active locale is Arabic, falling back to the English original
// otherwise — the "someone adds a product in English, someone else
// translates it later" workflow means a missing translation is a normal,
// expected state, not an error.
//
// Usage: localizedText(product, "name", locale) reads product.name /
// product.nameAr.
export function localizedText(obj, field, locale) {
  if (!obj) return "";
  if (locale === "ar") {
    const arValue = obj[`${field}Ar`];
    if (arValue) return arValue;
  }
  return obj[field] ?? "";
}
