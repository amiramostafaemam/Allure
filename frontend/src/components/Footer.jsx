import { Link } from "react-router";
import { HeadphonesIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-base-300 bg-base-100">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <div
              className="text-3xl leading-none text-primary"
              style={{ fontFamily: "'Alex Brush', cursive" }}
            >
              Allure
            </div>
            <p className="mt-3 text-sm leading-relaxed text-base-content/65">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
              {t("footer.shop")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/" className="link link-hover text-base-content/80">
                  {t("footer.allProducts")}
                </Link>
              </li>
              <li>
                <Link
                  to="/cart"
                  className="link link-hover text-base-content/80"
                >
                  {t("nav.cart")}
                </Link>
              </li>
              <li>
                <Link
                  to="/orders"
                  className="link link-hover text-base-content/80"
                >
                  {t("nav.orders")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
              {t("footer.support")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-start gap-2 text-base-content/70">
                <HeadphonesIcon
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  aria-hidden
                />
                <span>{t("footer.supportBlurb")}</span>
              </li>
              <li>
                <Link to="/contact" className="link link-hover text-base-content/80">
                  {t("footer.contactUs")}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="link link-hover text-base-content/80">
                  {t("footer.faq")}
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="link link-hover text-base-content/80">
                  {t("footer.shippingPolicy")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
              {t("footer.company")}
            </h3>
            <p className="mt-3 text-sm text-base-content/65">
              {t("footer.companyBlurb")}
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/about" className="link link-hover text-base-content/80">
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="link link-hover text-base-content/80">
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="link link-hover text-base-content/80">
                  {t("footer.privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 space-y-4 border-t border-base-300 pt-6">
          <p className="text-center text-xs text-base-content/50">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
