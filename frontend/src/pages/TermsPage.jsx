import { FileTextIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import StaticPageLayout from "../components/StaticPageLayout";

function TermsPage() {
  const { t } = useTranslation();
  return (
    <StaticPageLayout title={t("terms.title")} icon={FileTextIcon}>
      <p>{t("terms.intro")}</p>

      <h2>{t("terms.ordersPayment")}</h2>
      <p>{t("terms.ordersPaymentBody")}</p>

      <h2>{t("terms.cancellationsRefunds")}</h2>
      <p>{t("terms.cancellationsRefundsBody")}</p>

      <h2>{t("terms.account")}</h2>
      <p>{t("terms.accountBody")}</p>
    </StaticPageLayout>
  );
}

export default TermsPage;
