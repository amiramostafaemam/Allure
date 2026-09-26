import {
  CreditCardIcon,
  HeadphonesIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const ITEMS = [
  { key: "fulfillment", icon: TruckIcon },
  { key: "securePay", icon: ShieldCheckIcon },
  { key: "transparent", icon: CreditCardIcon },
  { key: "humanSupport", icon: HeadphonesIcon },
];

export function TrustStrip() {
  const { t } = useTranslation();
  return (
    <section className="grid grid-cols-1 gap-4 rounded-box border border-base-300 bg-base-100 p-6 sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map(({ key, icon: IconCmp }) => (
        <div key={key} className="flex gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconCmp className="size-5" aria-hidden />
          </div>
          <div>
            <h3 className="font-semibold text-base-content">{t(`home.trust.${key}.title`)}</h3>
            <p className="mt-0.5 text-sm text-base-content/65">{t(`home.trust.${key}.desc`)}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
