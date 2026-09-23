import { Show, SignInButton, UserButton } from "@clerk/react";
import { Link, NavLink } from "react-router";

import {
  LogInIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
} from "lucide-react";
import { useCart } from "../store/cart";
import { useMe } from "../hooks/useMe";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";

// Ghost nav link, highlighted only while its route is actually active —
// not a permanently-colored link regardless of where you are.
function navLinkClass({ isActive }) {
  return `btn btn-ghost gap-2 font-medium ${isActive ? "btn-active text-primary" : ""}`;
}

const Navbar = () => {
  const { role } = useMe();

  const cartCount = useCart((s) =>
    s.items.reduce((n, line) => n + line.quantity, 0),
  );

  return (
    <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/95 shadow-sm backdrop-blur-md">
      <div className="navbar mx-auto min-h-14 max-w-7xl px-4 py-2.5 md:px-6 md:py-3">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost px-2">
            <span
              className="text-3xl leading-none text-primary drop-shadow-[0_0_10px_rgba(31,184,84,0.4)] sm:text-[2.1rem]"
              style={{ fontFamily: "'Alex Brush', cursive" }}
            >
              Allure
            </span>
          </Link>
        </div>

        {/* min-w-0 overrides a flex item's default "never shrink below my
            content's width" floor — without it, this row (up to 7 icon
            buttons at once for a signed-in admin) forces the whole sticky
            navbar wider than a phone screen, and since nothing else on the
            page overflows, mobile browsers respond by zooming the entire
            page out to fit — every page looks "not responsive" even though
            only this row is actually too wide. overflow-x-auto gives it
            somewhere to go (a contained scroll) instead. */}
        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto md:gap-1.5">
          <NavLink to="/" end className={navLinkClass}>
            <ShoppingBagIcon className="size-6 opacity-90" aria-hidden />
            <span className="hidden sm:inline">Shop</span>
          </NavLink>

          <Show when={"signed-in"}>
            <NavLink to="/orders" className={navLinkClass}>
              <PackageIcon className="size-6 opacity-90" aria-hidden />
              <span className="hidden sm:inline">Orders</span>
            </NavLink>

            {role === "admin" ? (
              <NavLink to="/admin" className={navLinkClass}>
                <SettingsIcon className="size-6" aria-hidden />
                <span className="hidden sm:inline">Admin</span>
              </NavLink>
            ) : null}

            <NotificationBell />
          </Show>

          <NavLink
            to="/cart"
            className={({ isActive }) => `${navLinkClass({ isActive })} indicator`}
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
          >
            {cartCount > 0 ? (
              <span className="indicator-item badge badge-sm badge-primary min-w-2 px-1.5 font-sans text-xs tabular-nums">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
            <ShoppingCartIcon className="size-6 opacity-90" aria-hidden />
            <span className="hidden sm:inline">Cart</span>
          </NavLink>

          <ThemeToggle />

          <Show when={"signed-out"}>
            <SignInButton mode="modal">
              <button
                type="button"
                className="btn btn-primary btn-sm gap-1.5 px-3 shadow-md"
              >
                <LogInIcon className="size-4 drop-shadow-sm" aria-hidden />
                Sign in
              </button>
            </SignInButton>
          </Show>

          <Show when={"signed-in"}>
            <div className="flex items-center gap-2 border-l border-base-300 pl-3">
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
      </div>
    </header>
  );
};

export default Navbar;
