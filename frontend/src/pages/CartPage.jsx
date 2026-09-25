// frontend/src/pages/CartPage.jsx
import {
  HeadphonesIcon,
  LogInIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  Trash2Icon,
} from "lucide-react";
import useCartPage from "../hooks/useCartPage";
import EmptyCart from "../components/EmptyCart";
import { CartSkeleton } from "../components/LoadingSkeletons";
import PageError from "../components/PageError";
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl";
import { Link } from "react-router";
import { formatPrice } from "../utils/format";
import { Show, SignInButton } from "@clerk/react";

function CartPage() {
  const {
    items,
    lines,
    productsError,
    productsLoading,
    removeItem,
    setQty,
    subtotal,
  } = useCartPage();

  return (
    <div className="text-left">
      <h1 className="mb-8 flex items-center gap-2 text-3xl font-bold text-base-content">
        <ShoppingCartIcon className="size-8 text-primary" aria-hidden />
        Cart
      </h1>

      {items.length === 0 ? (
        <EmptyCart />
      ) : productsLoading ? (
        <CartSkeleton lines={items.length} />
      ) : productsError ? (
        <PageError message="Could not load product details. Refresh the page or try again shortly." />
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          <ul className="space-y-4">
            {lines.map(({ line, product: p, variant }) => {
              // Once a product has variants, stock lives per-variant — the
              // product's own stockQuantity is no longer the source of truth.
              const stockQuantity = line.variantId ? (variant?.stockQuantity ?? null) : (p?.stockQuantity ?? null);
              const maxQty = stockQuantity != null ? Math.min(99, stockQuantity) : 99;
              const overStock = stockQuantity != null && line.quantity > stockQuantity;
              return (
              <li
                key={`${line.productId}-${line.variantId ?? "base"}`}
                className="card card-side border border-base-300 bg-base-100 shadow-sm"
              >
                <figure className="p-4">
                  {p?.imageUrl ? (
                    <img
                      src={imageKitOptimizedUrl(
                        p.imageUrl,
                        IK_PRESETS.cartThumb,
                      )}
                      alt=""
                      className="h-24 w-24 rounded-box object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-box bg-base-300" />
                  )}
                </figure>
                <div className="card-body min-w-0 flex-row flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="card-title text-base">
                      {p ? (
                        <Link
                          to={`/product/${p.slug}`}
                          className="link-hover link-primary"
                        >
                          {p.name}
                        </Link>
                      ) : (
                        "Unknown product"
                      )}
                    </div>
                    {p ? (
                      <p className="text-sm text-base-content/60">
                        {formatPrice(p.pricePounds, p.currency)} each
                        {variant ? ` · ${p.variantName ?? "Option"}: ${variant.label}` : null}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="text-sm text-base-content/70">Qty</span>
                      <div className="join overflow-hidden rounded-full border border-base-300">
                        <button
                          type="button"
                          className="btn btn-sm join-item gap-0 px-2.5"
                          onClick={() =>
                            setQty(line.productId, line.quantity - 1, line.variantId)
                          }
                          aria-label={
                            line.quantity <= 1
                              ? "Remove from cart"
                              : "Decrease quantity"
                          }
                        >
                          <MinusIcon className="size-4" aria-hidden />
                        </button>
                        <span
                          className="join-item flex min-w-10 items-center justify-center bg-base-200 px-3 text-sm font-medium tabular-nums text-base-content"
                          aria-live="polite"
                        >
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm join-item gap-0 px-2.5"
                          onClick={() =>
                            setQty(
                              line.productId,
                              Math.min(maxQty, line.quantity + 1),
                              line.variantId,
                            )
                          }
                          disabled={line.quantity >= maxQty}
                          aria-label="Increase quantity"
                        >
                          <PlusIcon className="size-4" aria-hidden />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(line.productId, line.variantId)}
                        className="btn btn-ghost btn-square btn-sm text-error hover:bg-error/10"
                        aria-label="Remove from cart"
                        title="Remove from cart"
                      >
                        <Trash2Icon className="size-4" aria-hidden />
                      </button>
                    </div>
                    {overStock ? (
                      <p className="mt-1.5 text-xs font-medium text-error">
                        Only {stockQuantity} left — reduce quantity to check out
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right font-semibold text-base-content">
                    {p
                      ? formatPrice(p.pricePounds * line.quantity, p.currency)
                      : "-"}
                  </div>
                </div>
              </li>
              );
            })}
          </ul>

          <aside className="card border border-base-300 bg-base-100 p-6 shadow-md">
            <div className="flex justify-between text-sm">
              <span className="text-base-content/70">Subtotal</span>
              <span className="font-semibold text-base-content">
                {formatPrice(subtotal, lines[0]?.product?.currency ?? "egp")}
              </span>
            </div>

            <Show when="signed-in">
              <Link to="/checkout" className="btn btn-primary mt-6 w-full gap-2">
                <ShoppingCartIcon className="size-4" aria-hidden />
                Checkout securely
              </Link>
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="btn btn-outline btn-primary mt-6 w-full gap-2"
                >
                  <LogInIcon className="size-4" aria-hidden />
                  Sign in to checkout
                </button>
              </SignInButton>
            </Show>

            <p className="mt-4 flex items-start gap-2 text-xs text-base-content/60">
              <HeadphonesIcon
                className="mt-0.5 size-3.5 shrink-0 text-primary"
                aria-hidden
              />
              <span>
                After payment, open your order for{" "}
                <strong className="text-base-content">support chat</strong>.
                Video invites appear in that thread.
              </span>
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
export default CartPage;
