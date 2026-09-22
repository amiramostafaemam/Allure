import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  PackageIcon,
  SettingsIcon,
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
  { to: "/admin/products", label: "Products", icon: SettingsIcon },
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

  return (
    <div className={`grid gap-8 ${collapsed ? "lg:grid-cols-[72px_1fr]" : "lg:grid-cols-[220px_1fr]"}`}>
      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="btn btn-ghost btn-sm hidden shrink-0 justify-center gap-2 border border-base-300 lg:flex lg:w-full lg:justify-start"
        >
          {collapsed ? (
            <ChevronRightIcon className="size-4" aria-hidden />
          ) : (
            <>
              <ChevronLeftIcon className="size-4" aria-hidden />
              <span>Collapse</span>
            </>
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

      <div className="text-left">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
