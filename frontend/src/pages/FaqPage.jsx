import { HelpCircleIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import StaticPageLayout from "../components/StaticPageLayout";

const FAQ_KEYS = ["trackOrder", "cancelRefund", "supportChat", "paymentMethods", "reviewProduct"];

function FaqPage() {
  const { t } = useTranslation();
  return (
    <StaticPageLayout title={t("faq.title")} icon={HelpCircleIcon}>
      <div className="space-y-4">
        {FAQ_KEYS.map((key) => (
          <div key={key} className="collapse-arrow collapse rounded-box border border-base-300 bg-base-100">
            <input type="checkbox" />
            <div className="collapse-title text-base font-semibold text-base-content">
              {t(`faq.${key}.q`)}
            </div>
            <div className="collapse-content text-sm text-base-content/70">
              <p>{t(`faq.${key}.a`)}</p>
            </div>
          </div>
        ))}
      </div>
    </StaticPageLayout>
  );
}

export default FaqPage;
