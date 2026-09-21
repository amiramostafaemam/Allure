import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/react";
import { useCart } from "../store/cart";

// The cart is a plain localStorage store, not tied to any account — on a
// shared device, signing out should still wipe it so the next person to
// sign in doesn't inherit someone else's cart.
export default function CartSignOutSync() {
  const { isLoaded, isSignedIn } = useAuth();
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (wasSignedIn.current && !isSignedIn) {
      useCart.getState().clear();
    }
    wasSignedIn.current = isSignedIn;
  }, [isLoaded, isSignedIn]);

  return null;
}
