import { Link } from "react-router";
import {
  BanknoteIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  PackageIcon,
  UsersIcon,
} from "lucide-react";
import { useAdminStats } from "../hooks/useAdminStats";
import { AdminOverviewSkeleton } from "../components/LoadingSkeletons";
import PageError from "../components/PageError";
import { formatOrderNumber, formatOrderWhen, formatPrice } from "../utils/format";
import { statusBadgeClass } from "../utils/orderStatus";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card border border-base-300 bg-base-100 p-5">
      <div className="flex items-center gap-2 text-sm text-base-content/60">
        <Icon className="size-4" aria-hidden />
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-base-content">{value}</p>
    </div>
  );
}

function AdminOverviewPage() {
  const {
    revenuePounds,
    totalOrders,
    totalCustomers,
    ordersByStatus,
    topProducts,
    recentOrders,
    isLoading,
    isError,
  } = useAdminStats();

  if (isLoading) return <AdminOverviewSkeleton />;
  if (isError) return <PageError message="We couldn't load the dashboard stats." />;

  const paidOrders = ordersByStatus.paid ?? 0;

  return (
    <div className="space-y-8">
      <h1 className="flex items-center gap-2 text-3xl font-bold text-base-content">
        <LayoutDashboardIcon className="size-8 text-primary" aria-hidden />
        Overview
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BanknoteIcon} label="Revenue" value={formatPrice(revenuePounds, "egp")} />
        <StatCard icon={ClipboardListIcon} label="Total orders" value={totalOrders} />
        <StatCard icon={PackageIcon} label="Paid orders" value={paidOrders} />
        <StatCard icon={UsersIcon} label="Customers" value={totalCustomers} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <h2 className="card-title text-base">Top products</h2>
            {topProducts.length === 0 ? (
              <p className="text-sm text-base-content/60">No sales yet.</p>
            ) : (
              <ul className="divide-y divide-base-300">
                {topProducts.map((p) => (
                  <li key={p.productId} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-base-content">{p.name}</span>
                    <span className="font-semibold tabular-nums text-base-content/70">
                      {p.totalQuantity} sold
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h2 className="card-title text-base">Recent orders</h2>
              <Link to="/admin/orders" className="link-hover link-primary text-sm">
                View all
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-base-content/60">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-base-300">
                {recentOrders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium text-base-content">#{formatOrderNumber(order.orderNumber)}</p>
                      <p className="text-xs text-base-content/50">{formatOrderWhen(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge badge-sm capitalize ${statusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="font-semibold tabular-nums text-base-content">
                        {formatPrice(order.totalPounds, "egp")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOverviewPage;
