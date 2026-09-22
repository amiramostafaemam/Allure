import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { useCart } from "../store/cart";

const FLAG_KEY = "allure-was-signed-in";

// The cart is a plain localStorage store, not tied to any account — on a
// shared device, signing out should still wipe it so the next person to
// sign in doesn't inherit someone else's cart.
//
// This used to track the signed-in -> signed-out transition with an
// in-memory ref, but Clerk's <UserButton> sign-out isn't wired to
// react-router here (no routerPush/navigate passed to ClerkProvider), so
// it falls back to a real browser navigation — the page reloads before
// this component ever observes isSignedIn flip from true to false, and a
// fresh ref just starts at its initial value on the new page load. The
// "was signed in" bit has to live somewhere that survives that reload,
// so it's kept in localStorage instead.
export default function CartSignOutSync() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    try {
      const wasSignedIn = localStorage.getItem(FLAG_KEY) === "1";
      if (isSignedIn) {
        localStorage.setItem(FLAG_KEY, "1");
      } else if (wasSignedIn) {
        useCart.getState().clear();
        localStorage.removeItem(FLAG_KEY);
      }
    } catch {
      // best-effort — if storage is unavailable there's nothing to sync
    }
  }, [isLoaded, isSignedIn]);

  return null;
}
