import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { useCart } from "../store/cart";
import { apiFetch } from "../lib/api";

const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  governorate: "",
  country: "Egypt",
};

export function useCheckout() {
  const { getToken } = useAuth();
  const items = useCart((s) => s.items);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // When the user hits Back from the Polar checkout page, the browser can
  // restore this page from bfcache without a real reload, leaving
  // `submitting` stuck at true from before navigation. This resets it.
  useEffect(() => {
    function handlePageShow(event) {
      if (event.persisted) setSubmitting(false);
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  function setField(field, value) {
    setAddress((a) => ({ ...a, [field]: value }));
  }

  // Fills the form from a saved address (or resets it to blank for "enter a
  // new one"), stripping the id/label/isDefault fields that don't belong in
  // the order's own shipping-address shape.
  function fillFrom(saved) {
    if (!saved) {
      setAddress(EMPTY_ADDRESS);
      return;
    }
    setAddress({
      fullName: saved.fullName,
      phone: saved.phone,
      line1: saved.line1,
      line2: saved.line2 ?? "",
      city: saved.city,
      governorate: saved.governorate,
      country: saved.country,
    });
  }

  async function submitOrder(promoCode) {
    setSubmitting(true);
    setError("");

    const body = {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      shippingAddress: {
        ...address,
        line2: address.line2.trim() || undefined,
      },
      ...(promoCode ? { promoCode } : {}),
    };

    try {
      const res = await apiFetch("/api/checkout", { getToken, method: "POST", body });
      if (res?.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }
      setSubmitting(false);
    } catch (err) {
      setError(err.message || "Checkout failed. Please try again.");
      setSubmitting(false);
    }
  }

  return { items, address, setField, fillFrom, submitOrder, submitting, error };
}
