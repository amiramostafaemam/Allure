import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ar from "./ar.json";

// The pre-hydration script in index.html already stamps lang="ar"/"en" on
// <html> synchronously (same pattern as the theme script) — read that back
// as the initial language instead of re-deriving it, so this and
// store/locale.js can never disagree about which language is active.
const initialLanguage = document.documentElement.getAttribute("lang") === "ar" ? "ar" : "en";

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: { escapeValue: false }, // React already escapes
  returnEmptyString: false,
});

export default i18n;
