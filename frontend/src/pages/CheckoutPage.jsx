import { ArrowLeftIcon, MapPinIcon, ShoppingCartIcon, UserIcon } from "lucide-react";
import { Link } from "react-router";
import useCartPage from "../hooks/useCartPage";
import { useCheckout } from "../hooks/useCheckout";
import EmptyCart from "../components/EmptyCart";
import { CartSkeleton } from "../components/LoadingSkeletons";
import PageError from "../components/PageError";
import { formatPrice } from "../utils/format";

function Field({ label, optional, ...inputProps }) {
  return (
    <label className="form-control">
      <span className="label-text mb-1">
        {label}
        {optional ? <span className="text-base-content/40"> (optional)</span> : null}
      </span>
      <input className="input input-bordered w-full" {...inputProps} />
    </label>
  );
}

function SectionHeading({ icon: Icon, children }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-base-content/60">
      <Icon className="size-4" aria-hidden />
      {children}
    </h2>
  );
}

function CheckoutPage() {
  const { items, lines, subtotal, productsLoading, productsError } = useCartPage();
  const { address, setField, submitOrder, submitting, error } = useCheckout();

  if (items.length === 0) return <EmptyCart />;
  if (productsLoading) return <CartSkeleton lines={items.length} />;
  if (productsError) {
    return (
      <PageError message="Could not load product details. Refresh the page or try again shortly." />
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    submitOrder();
  }

  return (
    <div className="text-left">
      <Link to="/cart" className="btn btn-ghost btn-sm gap-2 px-2 text-base-content/70">
        <ArrowLeftIcon className="size-4" aria-hidden />
        Back to cart
      </Link>

      <h1 className="mb-8 mt-2 flex items-center gap-2 text-3xl font-bold text-base-content">
        <MapPinIcon className="size-8 text-primary" aria-hidden />
        Shipping details
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={handleSubmit}
          className="card border border-base-300 bg-base-100 shadow-lg"
        >
          <div className="card-body space-y-6">
            <section className="space-y-4">
              <SectionHeading icon={UserIcon}>Contact</SectionHeading>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Full name"
                  required
                  value={address.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                />
                <Field
                  label="Phone"
                  type="tel"
                  required
                  value={address.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>
            </section>

            <div className="divider my-0" />

            <section className="space-y-4">
              <SectionHeading icon={MapPinIcon}>Delivery address</SectionHeading>

              <Field
                label="Address line 1"
                required
                value={address.line1}
                onChange={(e) => setField("line1", e.target.value)}
              />

              <Field
                label="Address line 2"
                optional
                value={address.line2}
                onChange={(e) => setField("line2", e.target.value)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="City"
                  required
                  value={address.city}
                  onChange={(e) => setField("city", e.target.value)}
                />
                <Field
                  label="Governorate"
                  required
                  value={address.governorate}
                  onChange={(e) => setField("governorate", e.target.value)}
                />
              </div>

              <Field
                label="Country"
                required
                value={address.country}
                onChange={(e) => setField("country", e.target.value)}
              />
            </section>

            {error ? <p className="text-sm text-error">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="btn btn-primary w-full gap-2"
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm" aria-hidden />
              ) : (
                <ShoppingCartIcon className="size-4" aria-hidden />
              )}
              {submitting ? "Opening checkout…" : "Continue to payment"}
            </button>
          </div>
        </form>

        <aside className="card h-fit border border-base-300 bg-base-100 p-6 shadow-md">
          <h2 className="mb-4 text-sm font-semibold text-base-content">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {lines.map(({ line, product: p }) => (
              <li key={line.productId} className="flex justify-between gap-2">
                <span className="min-w-0 truncate text-base-content/70">
                  {p?.name ?? "Unknown product"} × {line.quantity}
                </span>
                <span className="shrink-0 tabular-nums text-base-content">
                  {p ? formatPrice(p.pricePounds * line.quantity, p.currency) : "-"}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-base-300 pt-4 text-sm">
            <span className="text-base-content/70">Subtotal</span>
            <span className="font-semibold text-base-content">
              {formatPrice(subtotal, lines[0]?.product?.currency ?? "egp")}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CheckoutPage;
