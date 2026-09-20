import { NavLink, Outlet } from "react-router";
import {
  LayoutDashboardIcon,
  PackageIcon,
  SettingsIcon,
  ShapesIcon,
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
];

function AdminLayout() {
  const { role, isLoading: meLoading } = useMe();

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
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `btn btn-sm shrink-0 justify-start gap-2 lg:w-full ${
                isActive ? "btn-primary" : "btn-ghost border border-base-300"
              }`
            }
          >
            <Icon className="size-4" aria-hidden />
            {label}
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
