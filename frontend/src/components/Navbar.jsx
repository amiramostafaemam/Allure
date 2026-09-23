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

// daisyUI's own --btn-p/--size defaults live in a deeper @layer than the
// .btn-sm/.btn-md modifier classes do, so "btn-sm sm:btn-md" doesn't
// reliably reset to the true default at sm: and up — it was quietly
// shrinking the desktop navbar too. Setting the custom properties
// directly as Tailwind utilities (max-sm: only, so nothing at all is
// generated above that breakpoint) sidesteps that layer ordering
// entirely — same fix already proven for the focus-ring issue elsewhere.
const MOBILE_BTN_SIZE =
  "max-sm:[--btn-p:.75rem]! max-sm:[--size:calc(var(--size-field,.25rem)*8)]!";

// Ghost nav link, highlighted only while its route is actually active —
// not a permanently-colored link regardless of where you are.
function navLinkClass({ isActive }) {
  return `btn btn-ghost gap-2 font-medium ${MOBILE_BTN_SIZE} ${isActive ? "btn-active text-primary" : ""}`;
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
            page out to fit — every page looked "not responsive" even
            though only this row was actually too wide. Every item below
            is sized down on mobile (btn-sm, smaller icons/avatar) so it
            fits without scrolling; overflow-x-hidden is only a last-resort
            safety net so a rare still-too-narrow screen silently clips the
            edge instead of the whole page zooming out again.
            overflow-y-visible has to be explicit here too: setting only
            overflow-x silently computes overflow-y to auto per the CSS
            spec, which was clipping the top of the cart badge (it pokes
            slightly above its icon by design via a -50% translate). */}
        <nav className="flex min-w-0 items-center gap-0.5 overflow-x-hidden overflow-y-visible sm:gap-1 md:gap-1.5">
          <NavLink to="/" end className={navLinkClass}>
            <ShoppingBagIcon className="size-5 opacity-90 sm:size-6" aria-hidden />
            <span className="hidden sm:inline">Shop</span>
          </NavLink>

          <Show when={"signed-in"}>
            <NavLink to="/orders" className={navLinkClass}>
              <PackageIcon className="size-5 opacity-90 sm:size-6" aria-hidden />
              <span className="hidden sm:inline">Orders</span>
            </NavLink>

            {role === "admin" ? (
              <NavLink to="/admin" className={navLinkClass}>
                <SettingsIcon className="size-5 sm:size-6" aria-hidden />
                <span className="hidden sm:inline">Admin</span>
              </NavLink>
            ) : null}

            <NotificationBell />
          </Show>

          <NavLink
            to="/cart"
            className={navLinkClass}
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
          >
            {/* The indicator badge anchors to its nearest "indicator"
                ancestor's corner — putting that class on the whole button
                (icon + "Cart" label) anchored the badge to the far corner
                of the whole pill, where it could bleed into the next
                button. Scoping "indicator" to just the icon keeps the
                badge tight against the icon regardless of the button's
                width. */}
            <span className="indicator">
              {cartCount > 0 ? (
                <span className="indicator-item badge badge-sm badge-primary min-w-2 px-1.5 font-sans text-xs tabular-nums">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
              <ShoppingCartIcon className="size-5 opacity-90 sm:size-6" aria-hidden />
            </span>
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
            <div className="flex items-center gap-1.5 border-l border-base-300 pl-1.5 sm:gap-2 sm:pl-3">
              <UserButton
                appearance={{
                  elements: { avatarBox: "h-8 w-8 ring-2 ring-base-300 sm:h-10 sm:w-10" },
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
