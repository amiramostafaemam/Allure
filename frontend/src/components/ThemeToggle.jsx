import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "../store/theme";

function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);

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
