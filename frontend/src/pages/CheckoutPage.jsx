import { useState } from "react";
import {
  ArrowLeftIcon,
  CheckIcon,
  MapPinIcon,
  PlusIcon,
  ShoppingCartIcon,
  TagIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { Link } from "react-router";
import useCartPage from "../hooks/useCartPage";
import { useCheckout } from "../hooks/useCheckout";
import { useSavedAddresses } from "../hooks/useSavedAddresses";
import { usePromoCode } from "../hooks/usePromoCode";
import EmptyCart from "../components/EmptyCart";
import { CartSkeleton } from "../components/LoadingSkeletons";
import PageError from "../components/PageError";
import { TextField } from "../components/FormField";
import { formatPrice } from "../utils/format";

function SectionHeading({ icon: Icon, children }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-base-content/60">
      <Icon className="size-4" aria-hidden />
      {children}
    </h2>
  );
}

function SavedAddressPicker({ addresses, selectedId, onSelect, onDelete, deletingId }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {addresses.map((addr) => {
        const selected = addr.id === selectedId;
        return (
          <div
            key={addr.id}
            className={`relative rounded-xl border p-3 text-left transition-colors ${
              selected ? "border-primary bg-primary/5" : "border-base-300 hover:border-primary/40"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(addr)}
              className="block w-full pr-6 text-left"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium text-base-content">
                {selected ? <CheckIcon className="size-3.5 shrink-0 text-primary" aria-hidden /> : null}
                {addr.label || addr.fullName}
              </span>
              <span className="mt-0.5 block truncate text-xs text-base-content/60">
                {addr.line1}, {addr.city}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(addr.id)}
              disabled={deletingId === addr.id}
              aria-label="Delete address"
              className="btn btn-ghost btn-xs btn-square absolute right-2 top-2 text-error hover:bg-error/10"
            >
              <Trash2Icon className="size-3.5" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function CheckoutPage() {
  const { items, lines, subtotal, productsLoading, productsError } = useCartPage();
  const { address, setField, fillFrom, submitOrder, submitting, error } = useCheckout();
  const { addresses, createAddress, deleteAddress } = useSavedAddresses();
  const promo = usePromoCode(items);
  const [promoInputOpen, setPromoInputOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [saveAddress, setSaveAddress] = useState(false);

  // Pre-fill from the default saved address the first time the list shows
  // up — adjusting state during render (not an effect) so this can't cause
  // an extra cascading render, and it only fires once thanks to the guard.
  const [autoFilled, setAutoFilled] = useState(false);
  if (!autoFilled && addresses.length > 0) {
    setAutoFilled(true);
    setSelectedAddressId(addresses[0].id);
    fillFrom(addresses[0]);
  }

  function selectAddress(addr) {
    setSelectedAddressId(addr.id);
    fillFrom(addr);
  }

  function startNewAddress() {
    setSelectedAddressId(null);
    fillFrom(null);
  }

  function handleDeleteAddress(id) {
    deleteAddress.mutate(id);
    if (selectedAddressId === id) {
      setSelectedAddressId(null);
    }
  }

  if (items.length === 0) return <EmptyCart />;
  if (productsLoading) return <CartSkeleton lines={items.length} />;
  if (productsError) {
    return (
      <PageError message="Could not load product details. Refresh the page or try again shortly." />
    );
  }

  const currency = lines[0]?.product?.currency ?? "egp";
  const total = promo.applied ? promo.applied.totalPounds : subtotal;

  function handleSubmit(e) {
    e.preventDefault();
    // Best-effort — saving the address is a convenience, not something
    // that should ever block or fail the actual checkout, so its result
    // is never awaited or surfaced here.
    if (saveAddress) createAddress.mutate(address);
    submitOrder(promo.applied?.code);
  }

  function handleApplyPromo(e) {
    e.preventDefault();
    promo.apply();
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={handleSubmit}
          className="card border border-base-300 bg-base-100 shadow-lg"
        >
          <div className="card-body space-y-6">
            <section className="space-y-4">
              <SectionHeading icon={UserIcon}>Contact</SectionHeading>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="Full name"
                  required
                  value={address.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                />
                <TextField
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

              {addresses.length > 0 ? (
                <div className="space-y-2">
                  <SavedAddressPicker
                    addresses={addresses}
                    selectedId={selectedAddressId}
                    onSelect={selectAddress}
                    onDelete={handleDeleteAddress}
                    deletingId={deleteAddress.isPending ? deleteAddress.variables : null}
                  />
                  <button
                    type="button"
                    onClick={startNewAddress}
                    className="btn btn-ghost btn-sm gap-2 px-2 text-base-content/60"
                  >
                    <PlusIcon className="size-3.5" aria-hidden />
                    Enter a new address
                  </button>
                  <div className="divider my-0" />
                </div>
              ) : null}

              <TextField
                label="Address line 1"
                required
                value={address.line1}
                onChange={(e) => setField("line1", e.target.value)}
              />

              <TextField
                label="Address line 2"
                optional
                value={address.line2}
                onChange={(e) => setField("line2", e.target.value)}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="City"
                  required
                  value={address.city}
                  onChange={(e) => setField("city", e.target.value)}
                />
                <TextField
                  label="Governorate"
                  required
                  value={address.governorate}
                  onChange={(e) => setField("governorate", e.target.value)}
                />
              </div>

              <TextField
                label="Country"
                required
                value={address.country}
                onChange={(e) => setField("country", e.target.value)}
              />

              <label className="flex cursor-pointer items-center gap-2 text-sm text-base-content/70">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                />
                Save this address for next time
              </label>
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

          <div className="mt-4 border-t border-base-300 pt-4">
            {promo.applied ? (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5 font-medium text-success">
                  <TagIcon className="size-3.5" aria-hidden />
                  {promo.applied.code} · {promo.applied.percentOff}% off
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs btn-square"
                  onClick={promo.clear}
                  aria-label="Remove promo code"
                >
                  <XIcon className="size-3.5" aria-hidden />
                </button>
              </div>
            ) : promoInputOpen ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input input-sm w-full rounded-lg uppercase transition-colors duration-150 focus:[--input-color:var(--color-primary)] focus:outline-none!"
                    placeholder="Promo code"
                    value={promo.code}
                    onChange={(e) => promo.setCode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={promo.validating || !promo.code.trim()}
                    onClick={handleApplyPromo}
                  >
                    {promo.validating ? "…" : "Apply"}
                  </button>
                </div>
                {promo.error ? <p className="text-xs text-error">{promo.error}</p> : null}
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm gap-2 px-2 text-base-content/60"
                onClick={() => setPromoInputOpen(true)}
              >
                <TagIcon className="size-3.5" aria-hidden />
                Have a promo code?
              </button>
            )}
            <p className="mt-1.5 text-xs text-base-content/40">
              Apply your code here — the payment page's own discount field is separate and won't
              recognize it.
            </p>
          </div>

          <div className="mt-4 space-y-1.5 border-t border-base-300 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-base-content/70">Subtotal</span>
              <span className="text-base-content">{formatPrice(subtotal, currency)}</span>
            </div>
            {promo.applied ? (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>−{formatPrice(promo.applied.discountPounds, currency)}</span>
              </div>
            ) : null}
            <div className="flex justify-between pt-1 text-base font-semibold text-base-content">
              <span>Total</span>
              <span>{formatPrice(total, currency)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CheckoutPage;
