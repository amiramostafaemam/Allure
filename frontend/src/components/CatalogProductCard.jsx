import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckIcon, PlusIcon, SlidersHorizontalIcon } from "lucide-react";
import { formatPrice } from "../utils/format.js";
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl.js";
import { useCart } from "../store/cart.js";
import { useLocale } from "../store/locale.js";
import { localizedText } from "../utils/localized.js";
import { WishlistButton } from "./WishlistButton.jsx";

export function CatalogProductCard({ product }) {
  const { t } = useTranslation();
  const locale = useLocale((s) => s.locale);
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const hasVariants = Boolean(product.variantName);
  const variants = product.variants ?? [];
  // A variant product's own stockQuantity isn't the source of truth once it
  // has variants — "out of stock" means every option is, not the product row.
  const outOfStock = hasVariants
    ? variants.length > 0 && variants.every((v) => v.stockQuantity != null && v.stockQuantity <= 0)
    : product.stockQuantity != null && product.stockQuantity <= 0;

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1200);
    return () => clearTimeout(timer);
  }, [added]);

  function handleAdd() {
    addItem(product.id);
    setAdded(true);
  }

  return (
    <article className="card group h-full overflow-hidden border border-base-300 bg-base-100 shadow-md transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl">
      <Link
        to={`/product/${product.slug}`}
        className="relative block overflow-hidden"
      >
        <figure className="aspect-4/3 bg-base-300">
          {product.imageUrl ? (
            <img
              src={imageKitOptimizedUrl(
                product.imageUrl,
                IK_PRESETS.catalogCard,
              )}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </figure>
        <span className="badge badge-sm badge-primary absolute left-3 top-3 border-0 text-xs font-medium shadow">
          {product.category ?? "General"}
        </span>
        {outOfStock ? (
          <span className="badge badge-sm badge-neutral absolute right-3 top-3 border-0 text-xs font-medium shadow">
            {t("catalog.outOfStock")}
          </span>
        ) : null}
      </Link>
      <div className="card-body grow gap-3 p-5 text-left">
        <Link
          to={`/product/${product.slug}`}
          className="card-title line-clamp-2 text-lg transition group-hover:text-primary"
        >
          {localizedText(product, "name", locale)}
        </Link>
        {/* dir="auto": see ProductPage.jsx — an untranslated description
            falls back to English inside this RTL card and needs the
            browser to detect its own direction, or trailing punctuation
            renders on the wrong side. */}
        <p className="line-clamp-3 text-sm leading-relaxed text-base-content/70" dir="auto">
          {localizedText(product, "description", locale)}
        </p>
        <div className="card-actions mt-auto items-center justify-between border-t border-base-200 pt-4">
          <span className="text-lg font-bold tabular-nums text-base-content">
            {formatPrice(product.pricePounds, product.currency)}
          </span>
          <div className="flex items-center gap-1">
            <WishlistButton productId={product.id} />
            {hasVariants ? (
              // A variant must be chosen before it can be added — send them
              // to the product page's picker instead of quick-adding.
              <Link
                to={`/product/${product.slug}`}
                aria-disabled={outOfStock}
                className={`btn btn-sm gap-1 shadow transition-colors ${outOfStock ? "btn-disabled" : "btn-primary"}`}
              >
                <SlidersHorizontalIcon className="size-4" aria-hidden />
                {outOfStock ? t("catalog.outOfStock") : t("catalog.selectOptions")}
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                disabled={added || outOfStock}
                className={`btn btn-sm gap-1 shadow transition-colors ${added ? "btn-neutral" : "btn-primary"}`}
              >
                {added ? (
                  <CheckIcon className="size-4" aria-hidden />
                ) : (
                  <PlusIcon className="size-4" aria-hidden />
                )}
                {added ? t("catalog.added") : outOfStock ? t("catalog.outOfStock") : t("catalog.add")}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
