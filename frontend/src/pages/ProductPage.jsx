import { Link } from "react-router";
import {
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
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl";
import { formatPrice } from "../utils/format";

function ProductPage() {
  const {
    product,
    relatedProducts,
    isLoading,
    isError,
    quantity,
    setQuantity,
    addToCart,
  } = useProductPage();

  if (isLoading) return <ProductPageSkeleton />;

  if (isError || !product) {
    return (
      <PageError
        message="We couldn't find this product. It may be unavailable or the link is wrong."
        action={{ to: "/", label: "Back to catalog" }}
      />
    );
  }

  return (
    <div className="text-left">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1.5 text-sm text-base-content/50"
      >
        <Link to="/" className="transition hover:text-primary">
          Shop
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" aria-hidden />
        <Link
          to={`/?category=${encodeURIComponent(product.category)}#catalog`}
          className="transition hover:text-primary"
        >
          {product.category}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate text-base-content/70">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
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
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
              <span className="badge absolute left-4 top-4 border-0 bg-primary/15 text-xs font-medium text-primary shadow backdrop-blur">
                {product.category ?? "General"}
              </span>
            </figure>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold tracking-tight text-balance text-base-content sm:text-4xl">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
            <span className="text-3xl font-bold tabular-nums text-base-content">
              {formatPrice(product.pricePounds, product.currency)}
            </span>
            <span className="text-sm text-base-content/50">
              tax where applicable
            </span>
          </div>

          <p className="leading-relaxed text-base-content/70">
            {product.description}
          </p>

          <div className="divider my-0" />

          <div className="flex flex-wrap items-center gap-4">
            <div className="join overflow-hidden rounded-full border border-base-300">
              <button
                type="button"
                className="btn join-item gap-0 px-4"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
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
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                disabled={quantity >= 99}
                aria-label="Increase quantity"
              >
                <PlusIcon className="size-4" aria-hidden />
              </button>
            </div>

            <button
              type="button"
              onClick={addToCart}
              className="btn btn-primary flex-1 gap-2 shadow-md sm:flex-none sm:px-10"
            >
              <ShoppingCartIcon className="size-5" aria-hidden />
              Add to cart
            </button>
          </div>

          <div className="grid gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <ShieldCheckIcon
                className="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold text-base-content">
                  Secure checkout
                </p>
                <p className="text-xs text-base-content/60">
                  Encrypted payments and order confirmation
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
                  Human support
                </p>
                <p className="text-xs text-base-content/60">
                  Order-scoped chat and optional video after payment
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
            You might also like
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
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
