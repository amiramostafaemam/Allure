import { motion, useReducedMotion } from "framer-motion";
import {
  BackpackIcon,
  CameraIcon,
  FootprintsIcon,
  GemIcon,
  HeadphonesIcon,
  HomeIcon,
  LayoutGridIcon,
  MonitorIcon,
  ShirtIcon,
  SprayCanIcon,
  WatchIcon,
  WifiIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocale } from "../store/locale";
import { localizedText } from "../utils/localized";

// A category is just {name, nameAr} from the API (see productController.ts's
// getCategories) with nothing visual attached — this maps the known English
// names (the canonical key used everywhere) to a representative icon, with a
// sensible fallback for any category added later that isn't in the list yet.
const CATEGORY_ICONS = {
  Accessories: GemIcon,
  Apparel: ShirtIcon,
  Audio: HeadphonesIcon,
  Beauty: SprayCanIcon,
  Cameras: CameraIcon,
  Footwear: FootprintsIcon,
  Fragrance: SprayCanIcon,
  Home: HomeIcon,
  Travel: BackpackIcon,
  Watches: WatchIcon,
  Wearables: WifiIcon,
  Workspace: MonitorIcon,
};

export function CategoryShowcase({ categories, loadingCategories, onSelect }) {
  const { t } = useTranslation();
  const locale = useLocale((s) => s.locale);
  const reduceMotion = useReducedMotion();

  if (!loadingCategories && categories.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-base-content/60">
        {t("home.browseByCategory")}
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {loadingCategories
          ? [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-24 rounded-box" aria-hidden />
            ))
          : categories.map((c, i) => {
              const Icon = CATEGORY_ICONS[c.name] ?? LayoutGridIcon;
              return (
                <motion.button
                  key={c.name}
                  type="button"
                  onClick={() => onSelect(c.name)}
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  whileHover={reduceMotion ? undefined : { y: -4 }}
                  className="flex flex-col items-center justify-center gap-2 rounded-box border border-base-300 bg-base-100 px-3 py-5 text-center shadow-sm transition-colors hover:border-primary/40 hover:shadow-md"
                >
                  <Icon className="size-6 text-primary" aria-hidden />
                  <span className="text-sm font-medium text-base-content">
                    {localizedText(c, "name", locale)}
                  </span>
                </motion.button>
              );
            })}
      </div>
    </section>
  );
}
