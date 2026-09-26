import { create } from "zustand";
import i18n from "../i18n";

const STORAGE_KEY = "allure-locale";
const RTL_LOCALES = new Set(["ar"]);

// The pre-hydration script in index.html already stamps lang/dir on <html>
// synchronously (before React mounts) to avoid a flash of the wrong
// direction — read that back rather than re-deriving it here, same pattern
// as store/theme.js.
function readInitialLocale() {
  return document.documentElement.getAttribute("lang") === "ar" ? "ar" : "en";
}

export const useLocale = create((set, get) => ({
  locale: readInitialLocale(),
  toggle() {
    const next = get().locale === "ar" ? "en" : "ar";
    applyLocale(next);
    set({ locale: next });
  },
}));

function applyLocale(locale) {
  document.documentElement.setAttribute("lang", locale);
  document.documentElement.setAttribute("dir", RTL_LOCALES.has(locale) ? "rtl" : "ltr");
  void i18n.changeLanguage(locale);
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // per-viewer convenience only — fine if storage is unavailable
  }
}

// i18next's own init (src/i18n/index.js) reads the same stamped attribute,
// so the two stay in sync from the very first render without this store
// needing to push a change on mount.
