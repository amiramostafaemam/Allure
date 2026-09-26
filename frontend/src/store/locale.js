import { create } from "zustand";

// Arabic support was removed — this always resolves to "en"/"ltr" now.
// Kept as a store (rather than a plain constant) so the many call sites
// doing `useLocale((s) => s.locale)` and passing it into localizedText()
// don't all need to change; localizedText() only ever reads a product's
// *Ar field when locale === "ar", so pinning this here is what makes any
// old Arabic content in the database permanently unreachable through the
// site without needing to touch that data.
export const useLocale = create(() => ({
  locale: "en",
}));
