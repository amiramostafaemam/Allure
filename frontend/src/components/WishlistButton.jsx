import { SignInButton, useAuth } from "@clerk/react";
import { HeartIcon } from "lucide-react";
import { useWishlist } from "../hooks/useWishlist";

// Reused both inside a <Link> (catalog card, over the product image) and
// standalone (product page). The outer span stops the click from bubbling
// regardless of whether the sign-in modal or the toggle fires below it, so
// it never also triggers a parent link's navigation.
export function WishlistButton({ productId, className = "" }) {
  const { isSignedIn } = useAuth();
  const { isWishlisted, addItem, removeItem } = useWishlist();
  const saved = isSignedIn && isWishlisted(productId);
  const pending = addItem.isPending || removeItem.isPending;

  function toggle() {
    if (saved) removeItem.mutate(productId);
    else addItem.mutate(productId);
  }

  const button = (
    <button
      type="button"
      onClick={isSignedIn ? toggle : undefined}
      disabled={isSignedIn && pending}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      className={`btn btn-ghost btn-square btn-sm ${className}`}
    >
      <HeartIcon
        className={`size-4 transition-colors ${saved ? "fill-error text-error" : "text-base-content/60"}`}
        aria-hidden
      />
    </button>
  );

  return (
    <span onClick={(e) => e.stopPropagation()}>
      {isSignedIn ? button : <SignInButton mode="modal">{button}</SignInButton>}
    </span>
  );
}
