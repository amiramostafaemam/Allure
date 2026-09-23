import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "../store/theme";

// daisyUI's --btn-p/--size defaults live in a deeper @layer than the
// .btn-sm/.btn-md modifier classes, so "btn-sm sm:btn-md" doesn't reliably
// reset above sm: — setting the custom properties directly (max-sm: only)
// sidesteps that layer ordering, same as Navbar's nav links.
const MOBILE_BTN_SIZE =
  "max-sm:[--btn-p:.75rem]! max-sm:[--size:calc(var(--size-field,.25rem)*8)]!";

function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);

  return (
    <button
      type="button"
      className={`btn btn-ghost btn-square ${MOBILE_BTN_SIZE}`}
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
