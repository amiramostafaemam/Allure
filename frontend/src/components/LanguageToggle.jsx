import { LanguagesIcon } from "lucide-react";
import { useLocale } from "../store/locale";

function LanguageToggle() {
  const locale = useLocale((s) => s.locale);
  const toggle = useLocale((s) => s.toggle);
  const target = locale === "ar" ? "EN" : "ع";

  return (
    <button
      type="button"
      className="btn btn-ghost btn-square"
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      onClick={toggle}
    >
      {/* Icon-only, matching ThemeToggle's pattern — the corner badge names
          the language a click switches TO, the same way the cart badge
          names a count (see Navbar.jsx's CartLink). */}
      <span className="indicator">
        <span className="indicator-item badge badge-primary badge-xs min-w-4 px-1 font-sans text-[0.6rem]">
          {target}
        </span>
        <LanguagesIcon className="size-5 opacity-90" aria-hidden />
      </span>
    </button>
  );
}

export default LanguageToggle;
