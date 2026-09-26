import { InfoIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import StaticPageLayout from "../components/StaticPageLayout";

function AboutPage() {
  const { t } = useTranslation();
  return (
    <StaticPageLayout title={t("about.title")} icon={InfoIcon}>
      <p>{t("about.p1")}</p>
      <p>{t("about.p2")}</p>
      <h2>{t("about.whatWeCareAbout")}</h2>
      <ul>
        <li>{t("about.li1")}</li>
        <li>{t("about.li2")}</li>
        <li>{t("about.li3")}</li>
      </ul>
    </StaticPageLayout>
  );
}

export default AboutPage;
