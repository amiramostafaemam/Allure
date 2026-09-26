import { ArrowRightIcon, PackageIcon, ShoppingCartIcon } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

export default function EmptyCart() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-base-300 bg-linear-to-b from-base-200/50 to-base-100 px-6 py-12 text-center sm:px-10 sm:py-16">
      <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-base-300/60 text-primary/80 ring-4 ring-base-200/80">
        <ShoppingCartIcon className="size-10" aria-hidden />
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
        {t("cart.empty.title")}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-base-content/65">
        {t("cart.empty.desc")}
      </p>
      <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
        <Link to="/#catalog" className="btn btn-primary gap-2 shadow-md">
          {t("common.browseCatalog")}
          <ArrowRightIcon className="size-4 rtl:rotate-180" aria-hidden />
        </Link>
        <Link
          to="/orders"
          className="btn btn-ghost gap-2 border border-white bg-base-100 hover:border-primary/35 hover:bg-base-200/50"
        >
          <PackageIcon className="size-4" aria-hidden />
          {t("cart.empty.viewOrders")}
        </Link>
      </div>
    </div>
  );
}
