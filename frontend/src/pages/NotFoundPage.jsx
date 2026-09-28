import { Link } from "react-router";
import { ArrowRightIcon, CompassIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl border border-base-300 bg-base-100 px-6 py-16 text-center sm:px-10">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-primary/5 blur-3xl"
        aria-hidden
      />

      <p className="relative text-8xl font-black tracking-tight text-primary/90 sm:text-9xl">
        404
      </p>

      <div className="relative mx-auto -mt-4 mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-base-100">
        <CompassIcon className="size-8" aria-hidden />
      </div>

      <h1 className="relative text-2xl font-bold tracking-tight text-base-content">
        {t("notFound.title")}
      </h1>
      <p className="relative mt-2 text-sm leading-relaxed text-base-content/65">
        {t("notFound.desc")}
      </p>
      <Link to="/" className="btn btn-primary relative mt-8 gap-2 shadow-md">
        {t("notFound.backToShop")}
        <ArrowRightIcon className="size-4 rtl:rotate-180" aria-hidden />
      </Link>
    </div>
  );
}

export default NotFoundPage;
