import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import {
  BoxIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  PackageIcon,
  ShapesIcon,
  TagIcon,
  UsersIcon,
} from "lucide-react";
import { useMe } from "../hooks/useMe";
import { AdminProductsTableSkeleton } from "./LoadingSkeletons";
import PageError from "./PageError";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboardIcon, end: true },
  { to: "/admin/orders", label: "Orders", icon: PackageIcon },
  { to: "/admin/customers", label: "Customers", icon: UsersIcon },
  { to: "/admin/categories", label: "Categories", icon: ShapesIcon },
  { to: "/admin/products", label: "Products", icon: BoxIcon },
  { to: "/admin/promo-codes", label: "Promo codes", icon: TagIcon },
];

function readStoredCollapsed() {
  try {
    return localStorage.getItem("admin-sidebar-collapsed") === "1";
  } catch {
    return false;
  }
}

function AdminLayout() {
  const { role, isLoading: meLoading } = useMe();
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin-sidebar-collapsed", next ? "1" : "0");
      } catch {
        // per-viewer convenience only — fine if storage is unavailable
      }
      return next;
    });
  }

  if (meLoading) return <AdminProductsTableSkeleton />;

  if (role !== "admin") {
    return (
      <PageError
        message="You don't have access to this page."
        action={{ to: "/", label: "Back to shop" }}
      />
    );
  }

  // Without an explicit grid-cols-1 base, a bare "grid" with no column
  // template sizes its single implicit column to fit its widest child's
  // natural (max-content) width — here, the nav row below, whose buttons
  // are all shrink-0 so they never compress. That silently forced this
  // whole grid (and so the whole admin page) wider than a phone screen,
  // which is a different flavor of the same "page renders wider than the
  // viewport" bug already root-caused in the main Navbar: nothing else on
  // the page overflows, so mobile browsers respond by zooming the entire
  // page out to fit rather than just scrolling the one row. grid-cols-1
  // gives the column a real minmax(0,1fr) track instead of unconstrained
  // auto, so the nav's own overflow-x-auto can actually do its job.
  return (
    <div
      className={`grid grid-cols-1 gap-8 ${collapsed ? "lg:grid-cols-[52px_1fr]" : "lg:grid-cols-[176px_1fr]"}`}
    >
      <nav className="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="btn btn-ghost btn-sm hidden shrink-0 justify-center border border-base-300 lg:flex lg:w-full"
        >
          {collapsed ? (
            <ChevronRightIcon className="size-4" aria-hidden />
          ) : (
            <ChevronLeftIcon className="size-4" aria-hidden />
          )}
        </button>

        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `btn btn-sm shrink-0 gap-2 lg:w-full ${collapsed ? "lg:justify-center" : "justify-start"} ${
                isActive ? "btn-primary" : "btn-ghost border border-base-300"
              }`
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="text-start">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
