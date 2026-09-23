import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "../store/theme";

function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);

  return (
    <button
      type="button"
      className="btn btn-sm sm:btn-md btn-ghost btn-square"
      aria-label={theme === "forest" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
    >
      {theme === "forest" ? (
        <SunIcon className="size-4 opacity-90 sm:size-5" aria-hidden />
      ) : (
        <MoonIcon className="size-4 opacity-90 sm:size-5" aria-hidden />
      )}
    </button>
  );
}

export default ThemeToggle;
