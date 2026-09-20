import { useState } from "react";
import { Link } from "react-router";
import { PackageIcon } from "lucide-react";
import { useAdminOrders } from "../hooks/useAdminOrders";
import { AdminTableSkeleton } from "../components/LoadingSkeletons";
import PageError from "../components/PageError";
import { formatOrderWhen, formatPrice } from "../utils/format";
import { nextStatusOptions, statusBadgeClass } from "../utils/orderStatus";

function StatusControl({ order, onChange, pending }) {
  const options = nextStatusOptions(order.status);
  if (options.length === 0) return null;

  return (
    <select
      className="select select-bordered select-xs"
      value=""
      disabled={pending}
      onChange={(e) => {
        if (e.target.value) onChange(order.id, e.target.value);
        e.target.value = "";
      }}
    >
      <option value="">Change status…</option>
      {options.map((status) => (
        <option key={status} value={status}>
          Mark {status}
          {status === "refunded" ? " (bookkeeping only)" : ""}
        </option>
      ))}
    </select>
  );
}

function AdminOrdersPage() {
  const { orders, isLoading, isError, updateStatus } = useAdminOrders();
  const [errorForId, setErrorForId] = useState(null);

  async function handleStatusChange(id, status) {
    setErrorForId(null);
    try {
      await updateStatus.mutateAsync({ id, status });
    } catch {
      setErrorForId(id);
    }
  }

  if (isLoading) return <AdminTableSkeleton columns={6} />;
  if (isError) return <PageError message="We couldn't load orders." />;

  return (
    <div>
      <h1 className="mb-8 flex items-center gap-2 text-3xl font-bold text-base-content">
        <PackageIcon className="size-8 text-primary" aria-hidden />
        Orders
      </h1>

      {orders.length === 0 ? (
        <div className="rounded-box border border-dashed border-base-300 bg-base-100 py-16 text-center text-base-content/60">
          No orders yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Placed</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link to={`/orders/${order.id}`} className="link-hover link-primary font-mono text-sm">
                      #{order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="text-sm">
                    {order.customer?.displayName || order.customer?.email || "—"}
                  </td>
                  <td className="tabular-nums">{formatPrice(order.totalPounds, "egp")}</td>
                  <td>
                    <span className={`badge badge-sm capitalize ${statusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="text-sm text-base-content/60">{formatOrderWhen(order.createdAt)}</td>
                  <td>
                    <div className="flex flex-col items-end gap-1">
                      <StatusControl
                        order={order}
                        onChange={handleStatusChange}
                        pending={updateStatus.isPending}
                      />
                      {errorForId === order.id ? (
                        <p className="text-xs text-error">Couldn't update status</p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminOrdersPage;
