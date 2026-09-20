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

  async function submitOrder() {
    setSubmitting(true);
    setError("");

    const body = {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      shippingAddress: {
        ...address,
        line2: address.line2.trim() || undefined,
      },
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

  return { items, address, setField, submitOrder, submitting, error };
}
