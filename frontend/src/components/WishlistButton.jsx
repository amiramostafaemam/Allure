import { SignInButton, useAuth } from "@clerk/react";
import { HeartIcon } from "lucide-react";
import { useWishlist } from "../hooks/useWishlist";

// The outer span both stops the click from bubbling AND prevents its
// default action — stopPropagation alone isn't enough when this sits
// inside a <Link>: it blocks the Link's own onClick (the one that would
// call preventDefault) from ever running, but does nothing to the click's
// native default action, so the browser still follows the anchor's href.
// Belt-and-suspenders even now that nothing renders this inside a <Link>
// anymore, so it stays safe wherever it's reused next.
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
    <span
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {isSignedIn ? button : <SignInButton mode="modal">{button}</SignInButton>}
    </span>
  );
}
