import { Link } from "react-router";
import { HeadphonesIcon } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-base-300 bg-base-100">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <div
              className="text-3xl leading-none text-primary"
              style={{ fontFamily: "'Alex Brush', cursive" }}
            >
              Allure
            </div>
            <p className="mt-3 text-sm leading-relaxed text-base-content/65">
              Curated hardware and workspace tools. Paid orders include priority
              support, chat with our team and join a video call when we share a
              link.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
              Shop
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/" className="link link-hover text-base-content/80">
                  All products
                </Link>
              </li>
              <li>
                <Link
                  to="/cart"
                  className="link link-hover text-base-content/80"
                >
                  Cart
                </Link>
              </li>
              <li>
                <Link
                  to="/orders"
                  className="link link-hover text-base-content/80"
                >
                  Orders
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
              Support
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-start gap-2 text-base-content/70">
                <HeadphonesIcon
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  aria-hidden
                />
                <span>
                  Order-scoped chat after payment. Video links shared in-thread.
                </span>
              </li>
              <li>
                <Link to="/contact" className="link link-hover text-base-content/80">
                  Contact us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="link link-hover text-base-content/80">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="link link-hover text-base-content/80">
                  Shipping policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
              Company
            </h3>
            <p className="mt-3 text-sm text-base-content/65">
              Built for teams who care about clear specs, fast fulfillment, and
              human support when it matters.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/about" className="link link-hover text-base-content/80">
                  About
                </Link>
              </li>
              <li>
                <Link to="/terms" className="link link-hover text-base-content/80">
                  Terms of service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="link link-hover text-base-content/80">
                  Privacy policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 space-y-4 border-t border-base-300 pt-6">
          <p className="text-center text-xs text-base-content/50">
            © {new Date().getFullYear()} Allure · All prices in EGP
          </p>
        </div>
      </div>
    </footer>
  );
}
