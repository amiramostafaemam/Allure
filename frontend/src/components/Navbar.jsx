import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Show, SignInButton, UserButton } from "@clerk/react";
import { Link, NavLink, useLocation } from "react-router";

import {
  HeartIcon,
  LogInIcon,
  MenuIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  XIcon,
} from "lucide-react";
import { useCart } from "../store/cart";
import { useMe } from "../hooks/useMe";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";

// Ghost nav link, highlighted only while its route is actually active —
// not a permanently-colored link regardless of where you are.
function navLinkClass({ isActive }) {
  return `btn btn-ghost gap-2 font-medium ${isActive ? "btn-active text-primary" : ""}`;
}

function mobileLinkClass({ isActive }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium ${
    isActive ? "bg-primary/10 text-primary" : "text-base-content/80 hover:bg-base-200"
  }`;
}

function CartLink({ cartCount, className, children }) {
  const { t } = useTranslation();
  return (
    <NavLink
      to="/cart"
      className={className}
      aria-label={cartCount > 0 ? t("nav.cartAria", { count: cartCount }) : t("nav.cartAriaEmpty")}
    >
      {/* The indicator badge anchors to its nearest "indicator" ancestor's
          corner — scoping that class to just the icon (not the whole
          button/row) keeps the badge tight against the cart icon no
          matter how wide the surrounding element is. */}
      <span className="indicator">
        {cartCount > 0 ? (
          <span className="indicator-item badge badge-sm badge-primary min-w-2 px-1.5 font-sans text-xs tabular-nums">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        ) : null}
        <ShoppingCartIcon className="size-5 opacity-90 sm:size-6" aria-hidden />
      </span>
      {children}
    </NavLink>
  );
}

const Navbar = () => {
  const { t } = useTranslation();
  const { role } = useMe();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile menu on any navigation, not just a click inside it —
  // covers the sign-in modal redirect, browser back/forward, etc. Adjusting
  // state during render (React's documented pattern for "reset on prop
  // change") instead of an effect, so this can't trigger an extra
  // cascading render.
  const [lastPathname, setLastPathname] = useState(location.pathname);
  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname);
    setMobileOpen(false);
  }

  const cartCount = useCart((s) =>
    s.items.reduce((n, line) => n + line.quantity, 0),
  );

  return (
    <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/95 shadow-sm backdrop-blur-md">
      <div className="navbar mx-auto min-h-14 max-w-7xl px-4 py-2.5 md:px-6 md:py-3">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost px-2">
            <span
              className="text-[2.1rem] leading-none text-primary drop-shadow-[0_0_10px_rgba(31,184,84,0.4)]"
              style={{ fontFamily: "'Alex Brush', cursive" }}
            >
              Allure
            </span>
          </Link>
        </div>

        {/* Full row with labels — tablet/desktop only. Squeezing up to 7
            icon buttons (signed-in admin) into a phone-width row kept
            causing overflow bugs, including ones that leaked into this
            desktop layout while being worked around — a hamburger menu
            below is the standard fix, not another round of shrinking. */}
        <nav className="hidden items-center gap-2 md:flex md:gap-2.5">
          <NavLink to="/" end className={navLinkClass}>
            <ShoppingBagIcon className="size-6 opacity-90" aria-hidden />
            <span>{t("nav.shop")}</span>
          </NavLink>

          <Show when={"signed-in"}>
            <NavLink to="/orders" className={navLinkClass}>
              <PackageIcon className="size-6 opacity-90" aria-hidden />
              <span>{t("nav.orders")}</span>
            </NavLink>

            <NavLink to="/wishlist" className={navLinkClass}>
              <HeartIcon className="size-6 opacity-90" aria-hidden />
              <span>{t("nav.wishlist")}</span>
            </NavLink>

            {role === "admin" ? (
              <NavLink to="/admin" className={navLinkClass}>
                <SettingsIcon className="size-6" aria-hidden />
                <span>{t("nav.admin")}</span>
              </NavLink>
            ) : null}

            <NotificationBell />
          </Show>

          <CartLink cartCount={cartCount} className={navLinkClass}>
            <span>{t("nav.cart")}</span>
          </CartLink>

          <ThemeToggle />
          <LanguageToggle />

          <Show when={"signed-out"}>
            <SignInButton mode="modal">
              <button
                type="button"
                className="btn btn-primary btn-sm gap-1.5 px-3 shadow-md"
              >
                <LogInIcon className="size-4 drop-shadow-sm" aria-hidden />
                {t("common.signIn")}
              </button>
            </SignInButton>
          </Show>

          <Show when={"signed-in"}>
            <div className="flex items-center gap-2 border-s border-base-300 ps-3">
              <UserButton
                appearance={{
                  elements: { avatarBox: "h-10 w-10 ring-2 ring-base-300" },
                }}
              />
              {role === "support" || role === "admin" ? (
                <span className="badge badge-primary badge-sm hidden capitalize md:inline-flex">
                  {role}
                </span>
              ) : null}
            </div>
          </Show>
        </nav>

        {/* Mobile: cart, notifications and the account avatar stay one tap
            away — the things people actually check often on a shopping
            site — everything else (nav links, theme) collapses behind the
            hamburger. Deliberately NOT adding the theme toggle here too:
            that's exactly the kind of extra icon that caused the overflow
            bugs this row already went through a few rounds of fixing, and
            unlike notifications/account it isn't something checked daily. */}
        <div className="flex items-center gap-1 md:hidden">
          <CartLink cartCount={cartCount} className="btn btn-ghost btn-square" />

          <Show when={"signed-in"}>
            <NotificationBell />
            <UserButton
              appearance={{
                elements: { avatarBox: "h-8 w-8 ring-2 ring-base-300" },
              }}
            />
          </Show>

          <button
            type="button"
            className="btn btn-ghost btn-square"
            aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? (
              <XIcon className="size-5" aria-hidden />
            ) : (
              <MenuIcon className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav className="border-t border-base-300 bg-base-100 px-4 py-3 md:hidden">
          <ul className="flex flex-col gap-1">
            <li>
              <NavLink to="/" end className={mobileLinkClass}>
                <ShoppingBagIcon className="size-5 opacity-90" aria-hidden />
                {t("nav.shop")}
              </NavLink>
            </li>

            <Show when={"signed-in"}>
              <li>
                <NavLink to="/orders" className={mobileLinkClass}>
                  <PackageIcon className="size-5 opacity-90" aria-hidden />
                  {t("nav.orders")}
                </NavLink>
              </li>

              <li>
                <NavLink to="/wishlist" className={mobileLinkClass}>
                  <HeartIcon className="size-5 opacity-90" aria-hidden />
                  {t("nav.wishlist")}
                </NavLink>
              </li>

              {role === "admin" ? (
                <li>
                  <NavLink to="/admin" className={mobileLinkClass}>
                    <SettingsIcon className="size-5" aria-hidden />
                    {t("nav.admin")}
                  </NavLink>
                </li>
              ) : null}
            </Show>
          </ul>

          <div className="mt-3 flex items-center justify-between border-t border-base-300 pt-3">
            <span className="text-sm font-medium text-base-content/70">{t("nav.theme")}</span>
            <ThemeToggle />
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-base-300 pt-3">
            <span className="text-sm font-medium text-base-content/70">{t("nav.language")}</span>
            <LanguageToggle />
          </div>

          <Show when={"signed-out"}>
            <div className="mt-3 border-t border-base-300 pt-3">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="btn btn-primary w-full gap-1.5 shadow-md"
                >
                  <LogInIcon className="size-4 drop-shadow-sm" aria-hidden />
                  {t("common.signIn")}
                </button>
              </SignInButton>
            </div>
          </Show>

          <Show when={"signed-in"}>
            {role === "support" || role === "admin" ? (
              <div className="mt-3 border-t border-base-300 pt-3">
                <span className="badge badge-primary badge-sm capitalize">{role}</span>
              </div>
            ) : null}
          </Show>
        </nav>
      ) : null}
    </header>
  );
};

export default Navbar;
