import { useState } from "react";
import { useAuth } from "@clerk/react";
import { apiFetch } from "../lib/api";

// Live "Apply" preview only — createCheckout() independently re-validates
// and recomputes the discount server-side at submit time, so this response
// is never the source of truth for what actually gets charged.
export function usePromoCode(items) {
  const { getToken } = useAuth();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(null);
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(false);

  async function apply() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setValidating(true);
    setError("");
    try {
      const res = await apiFetch("/api/checkout/promo/validate", {
        getToken,
        method: "POST",
        body: {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          promoCode: trimmed,
        },
      });
      if (res.valid) {
        setApplied(res);
      } else {
        setApplied(null);
        setError(res.error || "Invalid promo code");
      }
    } catch (err) {
      setApplied(null);
      setError(err.message || "Couldn't check that code. Try again.");
    } finally {
      setValidating(false);
    }
  }

  function clear() {
    setApplied(null);
    setCode("");
    setError("");
  }

  return { code, setCode, applied, error, validating, apply, clear };
}
