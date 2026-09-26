import { useState } from "react";
import {
  ArrowLeftIcon,
  CheckIcon,
  LogInIcon,
  MapPinIcon,
  PlusIcon,
  ShoppingCartIcon,
  TagIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { SignInButton, useAuth } from "@clerk/react";
import useCartPage from "../hooks/useCartPage";
import { useCheckout } from "../hooks/useCheckout";
import { useSavedAddresses } from "../hooks/useSavedAddresses";
import { usePromoCode } from "../hooks/usePromoCode";
import EmptyCart from "../components/EmptyCart";
import { CartSkeleton } from "../components/LoadingSkeletons";
import PageError from "../components/PageError";
import { TextField } from "../components/FormField";
import { formatPrice } from "../utils/format";
import { useLocale } from "../store/locale";
import { localizedText } from "../utils/localized";

function SectionHeading({ icon: Icon, children }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-base-content/60">
      <Icon className="size-4" aria-hidden />
      {children}
    </h2>
  );
}

function SavedAddressPicker({ addresses, selectedId, onSelect, onDelete, deletingId }) {
  const { t } = useTranslation();
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
              aria-label={t("checkout.deleteAddress")}
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
  const { t } = useTranslation();
  const locale = useLocale((s) => s.locale);
  const { isSignedIn } = useAuth();
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

  // Nothing previously stopped a signed-out visitor from filling out the
  // whole shipping form — checkout only actually checks auth server-side,
  // at submit time, and surfaced that as a bare "Unauthorized" string with
  // no indication of what to do about it. The cart itself stays guest-
  // friendly (still true above this point) since forcing sign-in earlier
  // than necessary hurts conversion, but checkout genuinely needs an
  // account, so say so up front instead of letting them fill in a form
  // that was always going to fail.
  if (!isSignedIn) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-16 text-center">
        <p className="text-base-content/60">{t("checkout.signInToContinue")}</p>
        <SignInButton mode="modal">
          <button type="button" className="btn btn-primary mt-6 gap-2 shadow-md">
            <LogInIcon className="size-4" aria-hidden />
            {t("common.signIn")}
          </button>
        </SignInButton>
      </div>
    );
  }

  if (productsLoading) return <CartSkeleton lines={items.length} />;
  if (productsError) {
    return (
      <PageError message={t("cart.loadError")} />
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
        <ArrowLeftIcon className="size-4 rtl:rotate-180" aria-hidden />
        {t("checkout.backToCart")}
      </Link>

      <h1 className="mb-8 mt-2 flex items-center gap-2 text-3xl font-bold text-base-content">
        <MapPinIcon className="size-8 text-primary" aria-hidden />
        {t("checkout.shippingDetails")}
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={handleSubmit}
          className="card border border-base-300 bg-base-100 shadow-lg"
        >
          <div className="card-body space-y-6">
            <section className="space-y-4">
              <SectionHeading icon={UserIcon}>{t("checkout.contact")}</SectionHeading>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label={t("checkout.fullName")}
                  required
                  value={address.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                />
                <TextField
                  label={t("checkout.phone")}
                  type="tel"
                  required
                  value={address.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>
            </section>

            <div className="divider my-0" />

            <section className="space-y-4">
              <SectionHeading icon={MapPinIcon}>{t("checkout.deliveryAddress")}</SectionHeading>

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
                    {t("checkout.enterNewAddress")}
                  </button>
                  <div className="divider my-0" />
                </div>
              ) : null}

              <TextField
                label={t("checkout.addressLine1")}
                required
                value={address.line1}
                onChange={(e) => setField("line1", e.target.value)}
              />

              <TextField
                label={t("checkout.addressLine2")}
                optional
                value={address.line2}
                onChange={(e) => setField("line2", e.target.value)}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label={t("checkout.city")}
                  required
                  value={address.city}
                  onChange={(e) => setField("city", e.target.value)}
                />
                <TextField
                  label={t("checkout.governorate")}
                  required
                  value={address.governorate}
                  onChange={(e) => setField("governorate", e.target.value)}
                />
              </div>

              <TextField
                label={t("checkout.country")}
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
                {t("checkout.saveAddress")}
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
              {submitting ? t("checkout.openingCheckout") : t("checkout.continueToPayment")}
            </button>
          </div>
        </form>

        <aside className="card h-fit border border-base-300 bg-base-100 p-6 shadow-md">
          <h2 className="mb-4 text-sm font-semibold text-base-content">{t("checkout.orderSummary")}</h2>
          <ul className="space-y-2 text-sm">
            {lines.map(({ line, product: p }) => (
              <li key={line.productId} className="flex justify-between gap-2">
                <span className="min-w-0 truncate text-base-content/70">
                  {p ? localizedText(p, "name", locale) : t("cart.unknownProduct")} × {line.quantity}
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
                  {t("checkout.promoApplied", { code: promo.applied.code, percent: promo.applied.percentOff })}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs btn-square"
                  onClick={promo.clear}
                  aria-label={t("checkout.removePromoCode")}
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
                    placeholder={t("checkout.promoCode")}
                    value={promo.code}
                    onChange={(e) => promo.setCode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={promo.validating || !promo.code.trim()}
                    onClick={handleApplyPromo}
                  >
                    {promo.validating ? "…" : t("checkout.apply")}
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
                {t("checkout.havePromoCode")}
              </button>
            )}
            <p className="mt-1.5 text-xs text-base-content/40">
              {t("checkout.promoHint")}
            </p>
          </div>

          <div className="mt-4 space-y-1.5 border-t border-base-300 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-base-content/70">{t("cart.subtotal")}</span>
              <span className="text-base-content">{formatPrice(subtotal, currency)}</span>
            </div>
            {promo.applied ? (
              <div className="flex justify-between text-success">
                <span>{t("checkout.discount")}</span>
                <span>−{formatPrice(promo.applied.discountPounds, currency)}</span>
              </div>
            ) : null}
            <div className="flex justify-between pt-1 text-base font-semibold text-base-content">
              <span>{t("checkout.total")}</span>
              <span>{formatPrice(total, currency)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CheckoutPage;
