import { LockIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import StaticPageLayout from "../components/StaticPageLayout";

function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <StaticPageLayout title={t("privacy.title")} icon={LockIcon}>
      <p>{t("privacy.intro")}</p>

      <h2>{t("privacy.whatWeCollect")}</h2>
      <ul>
        <li>{t("privacy.collect1")}</li>
        <li>{t("privacy.collect2")}</li>
        <li>{t("privacy.collect3")}</li>
      </ul>

      <h2>{t("privacy.whatWeDontCollect")}</h2>
      <p>{t("privacy.dontCollectBody")}</p>

      <h2>{t("privacy.thirdParties")}</h2>
      <p>{t("privacy.thirdPartiesBody")}</p>
    </StaticPageLayout>
  );
}

export default PrivacyPage;
