import { TruckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import StaticPageLayout from "../components/StaticPageLayout";

function ShippingPolicyPage() {
  const { t } = useTranslation();
  return (
    <StaticPageLayout title={t("shipping.title")} icon={TruckIcon}>
      <p>{t("shipping.intro")}</p>

      <h2>{t("shipping.orderStatus")}</h2>
      <p>{t("shipping.orderStatusBody")}</p>

      <h2>{t("shipping.deliveryIssues")}</h2>
      <p>{t("shipping.deliveryIssuesBody")}</p>
    </StaticPageLayout>
  );
}

export default ShippingPolicyPage;
