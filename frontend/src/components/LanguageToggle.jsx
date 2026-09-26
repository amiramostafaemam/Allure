import { LanguagesIcon } from "lucide-react";
import { useLocale } from "../store/locale";

function LanguageToggle() {
  const locale = useLocale((s) => s.locale);
  const toggle = useLocale((s) => s.toggle);

  return (
    <button
      type="button"
      className="btn btn-ghost gap-1.5"
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      onClick={toggle}
    >
      <LanguagesIcon className="size-5 opacity-90" aria-hidden />
      <span className="text-sm font-medium">{locale === "ar" ? "EN" : "عربي"}</span>
    </button>
  );
}

export default LanguageToggle;
