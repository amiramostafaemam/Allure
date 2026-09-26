import { Link } from "react-router";
import { ArrowRightIcon, CompassIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-base-300 bg-linear-to-b from-base-200/50 to-base-100 px-6 py-16 text-center sm:px-10">
      <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-base-300/60 text-primary/80 ring-4 ring-base-200/80">
        <CompassIcon className="size-10" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-base-content">
        {t("notFound.title")}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-base-content/65">
        {t("notFound.desc")}
      </p>
      <Link to="/" className="btn btn-primary mt-8 gap-2 shadow-md">
        {t("notFound.backToShop")}
        <ArrowRightIcon className="size-4 rtl:rotate-180" aria-hidden />
      </Link>
    </div>
  );
}

export default NotFoundPage;
