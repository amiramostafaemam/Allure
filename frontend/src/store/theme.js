import { create } from "zustand";

const STORAGE_KEY = "allure-theme";

// The pre-hydration script in index.html already stamps data-theme on
// <html> synchronously (before React mounts) to avoid a flash of the
// wrong theme — read that back rather than re-deriving it here.
function readInitialTheme() {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "forest";
}

export const useTheme = create((set, get) => ({
  theme: readInitialTheme(),
  toggle() {
    const next = get().theme === "forest" ? "light" : "forest";
    document.documentElement.setAttribute("data-theme", next);
    // Keeps the browser chrome/status bar tint matching the theme that's
    // actually applied — the index.html inline script sets this correctly
    // on first paint, but only this toggle can keep it in sync afterward.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "light" ? "#f6faf6" : "#1b1717");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // per-viewer convenience only — fine if storage is unavailable
    }
    set({ theme: next });
  },
}));
