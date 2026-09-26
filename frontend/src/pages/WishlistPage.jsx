import { useAuth, SignInButton } from "@clerk/react";
import { Link } from "react-router";
import { HeartIcon, LogInIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useWishlist } from "../hooks/useWishlist";
import { CatalogProductCard } from "../components/CatalogProductCard";

function WishlistPage() {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const { items, isLoading } = useWishlist();

  return (
    <div className="text-start">
      <h1 className="mb-8 flex items-center gap-2 text-3xl font-bold text-base-content">
        <HeartIcon className="size-8 text-primary" aria-hidden />
        {t("wishlist.title")}
      </h1>

      {!isSignedIn ? (
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-16 text-center">
          <p className="text-base-content/60">{t("wishlist.signInPrompt")}</p>
          <SignInButton mode="modal">
            <button type="button" className="btn btn-primary mt-6 gap-2 shadow-md">
              <LogInIcon className="size-4" aria-hidden />
              {t("common.signIn")}
            </button>
          </SignInButton>
        </div>
      ) : isLoading ? (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <li key={i}>
              <div className="skeleton h-96 w-full rounded-box" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-16 text-center">
          <p className="text-base-content/60">
            {t("wishlist.empty")}
          </p>
          <Link to="/" className="btn btn-primary mt-6 gap-2 shadow-md">
            {t("common.browseCatalog")}
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((product) => (
            <li key={product.id}>
              <CatalogProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default WishlistPage;
