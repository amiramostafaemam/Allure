import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useCart } from "../store/cart";

const MAX_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 2000;

// Polar's webhook fulfills the order asynchronously, so the order this
// checkout produced may not exist yet the instant the browser returns here.
export function useCheckoutReturn() {
  const [searchParams] = useSearchParams();
  const checkoutId = searchParams.get("checkout_id");
  const { getToken, isSignedIn } = useAuth();
  const clearCart = useCart((s) => s.clear);
  const clearedRef = useRef(false);
  const attemptsRef = useRef(0);
  const [timedOut, setTimedOut] = useState(false);

  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ["orders"],
    queryFn: () => apiFetch("/api/orders", { getToken }),
    enabled: Boolean(checkoutId) && isSignedIn,
    refetchInterval: (query) => {
      const orders = query.state.data?.orders ?? [];
      const found = orders.some((o) => o.polarCheckoutId === checkoutId);
      return found ? false : POLL_INTERVAL_MS;
    },
  });

  const orders = data?.orders ?? [];
  const order = orders.find((o) => o.polarCheckoutId === checkoutId) ?? null;

  useEffect(() => {
    if (!dataUpdatedAt || order) return;
    attemptsRef.current += 1;
    if (attemptsRef.current >= MAX_ATTEMPTS) setTimedOut(true);
  }, [dataUpdatedAt, order]);

  // Polar only sends the browser here after a successful payment (a failed
  // or cancelled checkout returns to /cart instead), so the cart is safe to
  // clear as soon as we land here — don't wait on the order row, which
  // depends on the fulfillment webhook and may lag behind (or never arrive
  // if the webhook isn't reachable, e.g. testing against a local server).
  useEffect(() => {
    if (checkoutId && !clearedRef.current) {
      clearedRef.current = true;
      clearCart();
    }
  }, [checkoutId, clearCart]);

  return {
    checkoutId,
    order,
    isLoading: isLoading && !data,
    isError,
    pending: Boolean(checkoutId) && !order && !timedOut && !isError,
    timedOut,
  };
}
