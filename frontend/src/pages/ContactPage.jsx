import { Link } from "react-router";
import { HeadphonesIcon, MailIcon, PackageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import StaticPageLayout from "../components/StaticPageLayout";

function ContactPage() {
  const { t } = useTranslation();
  return (
    <StaticPageLayout title={t("contact.title")} icon={MailIcon}>
      <p>{t("contact.fastestWay")}</p>
      <Link to="/orders" className="btn btn-primary gap-2 shadow-md">
        <PackageIcon className="size-4" aria-hidden />
        {t("contact.goToOrders")}
      </Link>

      <h2>{t("contact.somethingElse")}</h2>
      <p className="flex items-start gap-2">
        <HeadphonesIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>
          {t("contact.beforeOrderPrefix")}{" "}
          <a href="mailto:hello@allure-supply.example" className="link link-primary">
            hello@allure-supply.example
          </a>
          {t("contact.beforeOrderSuffix")}
        </span>
      </p>
    </StaticPageLayout>
  );
}

export default ContactPage;
