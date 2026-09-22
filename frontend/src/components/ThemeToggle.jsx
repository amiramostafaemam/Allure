import { useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";

const STORAGE_KEY = "allure-theme";

function readInitialTheme() {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "forest";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // per-viewer convenience only — fine if storage is unavailable
  }
}

function ThemeToggle() {
  const [theme, setTheme] = useState(readInitialTheme);

  function toggle() {
    const next = theme === "forest" ? "light" : "forest";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      className="btn btn-ghost btn-square"
      aria-label={theme === "forest" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
    >
      {theme === "forest" ? (
        <SunIcon className="size-5 opacity-90" aria-hidden />
      ) : (
        <MoonIcon className="size-5 opacity-90" aria-hidden />
      )}
    </button>
  );
}

export default ThemeToggle;
