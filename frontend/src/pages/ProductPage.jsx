import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  CheckIcon,
  ChevronRightIcon,
  HeadphonesIcon,
  MinusIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
} from "lucide-react";
import { useProductPage } from "../hooks/useProductPage";
import { CatalogProductCard } from "../components/CatalogProductCard";
import { ProductReviews } from "../components/ProductReviews";
import { ProductPageSkeleton } from "../components/LoadingSkeletons";
import PageError from "../components/PageError";
import { WishlistButton } from "../components/WishlistButton";
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl";
import { formatPrice } from "../utils/format";
import { useLocale } from "../store/locale";
import { localizedText } from "../utils/localized";

function ProductPage() {
  const { t } = useTranslation();
  const locale = useLocale((s) => s.locale);
  const {
    product,
    relatedProducts,
    isLoading,
    isError,
    quantity,
    setQuantity,
    selectedVariantId,
    setSelectedVariantId,
    selectedVariant,
    addToCart,
  } = useProductPage();

  const [added, setAdded] = useState(false);
  const hasVariants = Boolean(product?.variantName);
  const variants = product?.variants ?? [];
  // A variant product's own stockQuantity isn't the source of truth once it
  // has variants — stock lives on the selected option instead.
  const stockQuantity = hasVariants ? (selectedVariant?.stockQuantity ?? null) : (product?.stockQuantity ?? null);
  const outOfStock = stockQuantity !== null && stockQuantity <= 0;
  const maxQty = stockQuantity !== null ? Math.min(99, stockQuantity) : 99;

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1200);
    return () => clearTimeout(timer);
  }, [added]);

  function handleAddToCart() {
    addToCart();
    setAdded(true);
  }

  if (isLoading) return <ProductPageSkeleton />;

  if (isError || !product) {
    return (
      <PageError
        message={t("product.notFound")}
        action={{ to: "/", label: t("product.backToCatalog") }}
      />
    );
  }

  return (
    <div className="text-start">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1.5 text-sm text-base-content/50"
      >
        <Link to="/" className="transition hover:text-primary">
          {t("nav.shop")}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0 rtl:rotate-180" aria-hidden />
        <Link
          to={`/?category=${encodeURIComponent(product.category)}#catalog`}
          className="transition hover:text-primary"
        >
          {product.category}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0 rtl:rotate-180" aria-hidden />
        <span className="truncate text-base-content/70">{localizedText(product, "name", locale)}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-xl">
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
              aria-hidden
            />
            <figure className="relative aspect-square bg-base-300">
              {product.imageUrl ? (
                <img
                  src={imageKitOptimizedUrl(
                    product.imageUrl,
                    IK_PRESETS.productHero,
                  )}
                  alt={localizedText(product, "name", locale)}
                  className="h-full w-full object-cover"
                />
              ) : null}
              <span className="badge badge-primary absolute left-4 top-4 border-0 text-xs font-medium shadow">
                {product.category ?? "General"}
              </span>
            </figure>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold tracking-tight text-balance text-base-content sm:text-4xl">
            {localizedText(product, "name", locale)}
          </h1>

          <div className="flex items-baseline gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
            <span className="text-3xl font-bold tabular-nums text-base-content">
              {formatPrice(product.pricePounds, product.currency)}
            </span>
            <span className="text-sm text-base-content/50">
              {t("product.taxWhereApplicable")}
            </span>
          </div>

          {/* dir="auto": an untranslated product still falls back to its
              English description while the page is RTL — without this,
              the browser's bidi algorithm misplaces trailing punctuation
              (e.g. a sentence-ending period jumping to the wrong end of a
              wrapped line). Letting the browser detect direction per the
              text's own first strong character fixes both cases. */}
          <p className="leading-relaxed text-base-content/70" dir="auto">
            {localizedText(product, "description", locale)}
          </p>

          {hasVariants ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-base-content/80">
                {localizedText(product, "variantName", locale)}
                {selectedVariant ? (
                  <span className="text-base-content/50"> — {localizedText(selectedVariant, "label", locale)}</span>
                ) : null}
              </span>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const variantOut = v.stockQuantity != null && v.stockQuantity <= 0;
                  const isSelected = v.id === selectedVariantId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      disabled={variantOut}
                      className={`btn btn-sm ${
                        isSelected ? "btn-primary" : "btn-ghost border border-base-300"
                      } ${variantOut ? "line-through opacity-50" : ""}`}
                    >
                      {localizedText(v, "label", locale)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="divider my-0" />

          <div className="flex flex-col gap-3">
            {/* Quantity + wishlist share a row — justify-between left them
                as two small islands with a dead gap between them at most
                widths. Splitting the row 2:1 and centering each control in
                its own share reads as a deliberate layout instead. */}
            <div className="flex items-stretch gap-4">
              <div className="flex flex-2 items-center justify-center">
                <div className="join overflow-hidden rounded-full border border-base-300">
                  <button
                    type="button"
                    className="btn join-item gap-0 px-4"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label={t("product.decreaseQuantity")}
                  >
                    <MinusIcon className="size-4" aria-hidden />
                  </button>
                  <span
                    className="join-item flex min-w-14 items-center justify-center bg-base-200 px-3 text-base font-semibold tabular-nums text-base-content"
                    aria-live="polite"
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="btn join-item gap-0 px-4"
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    disabled={outOfStock || quantity >= maxQty}
                    aria-label={t("product.increaseQuantity")}
                  >
                    <PlusIcon className="size-4" aria-hidden />
                  </button>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-center">
                <WishlistButton
                  productId={product.id}
                  className="border border-base-300 shadow-sm"
                />
              </div>
            </div>

            {outOfStock ? (
              <p className="text-sm font-medium text-error">{t("catalog.outOfStock")}</p>
            ) : stockQuantity !== null && stockQuantity <= 5 ? (
              <p className="text-sm font-medium text-warning">
                {t("product.onlyLeftInStock", { count: stockQuantity })}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={added || outOfStock}
              className={`btn w-full gap-2 shadow-md transition-colors sm:w-auto sm:self-start sm:px-10 ${
                added ? "btn-neutral" : "btn-primary"
              }`}
            >
              {added ? (
                <CheckIcon className="size-5" aria-hidden />
              ) : (
                <ShoppingCartIcon className="size-5" aria-hidden />
              )}
              {added ? t("product.addedToCart") : outOfStock ? t("catalog.outOfStock") : t("product.addToCart")}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <ShieldCheckIcon
                className="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold text-base-content">
                  {t("product.secureCheckout")}
                </p>
                <p className="text-xs text-base-content/60">
                  {t("product.secureCheckoutDesc")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <HeadphonesIcon
                className="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold text-base-content">
                  {t("product.humanSupport")}
                </p>
                <p className="text-xs text-base-content/60">
                  {t("product.humanSupportDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductReviews slug={product.slug} />

      {relatedProducts.length > 0 ? (
        <section className="mt-16 border-t border-base-300 pt-12">
          <h2 className="mb-6 text-xl font-bold uppercase tracking-wide text-base-content">
            {t("product.youMightAlsoLike")}
          </h2>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.slice(0, 4).map((p) => (
              <li key={p.id}>
                <CatalogProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default ProductPage;
