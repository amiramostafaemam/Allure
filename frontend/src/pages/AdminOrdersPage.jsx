import { useState } from "react";
import { Link } from "react-router";
import { PackageIcon } from "lucide-react";
import { useAdminOrders } from "../hooks/useAdminOrders";
import { AdminTableSkeleton } from "../components/LoadingSkeletons";
import PageError from "../components/PageError";
import { SearchInput } from "../components/SearchInput";
import { OrderStaffControls } from "../components/OrderStaffControls";
import { SelectField } from "../components/FormField";
import { formatOrderNumber, formatOrderWhen, formatPrice } from "../utils/format";
import { statusBadgeClass } from "../utils/orderStatus";

const ALL_STATUSES = ["pending", "paid", "failed", "shipped", "delivered", "cancelled", "refunded"];

function AdminOrdersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const { orders, isLoading, isError, updateStatus, dismissRequest } = useAdminOrders({ status, q });
  const [errorForId, setErrorForId] = useState(null);

  async function handleStatusChange(id, status) {
    setErrorForId(null);
    try {
      await updateStatus.mutateAsync({ id, status });
    } catch {
      setErrorForId(id);
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-base-content">
          <PackageIcon className="size-8 text-primary" aria-hidden />
          Orders
        </h1>

        <div className="flex flex-wrap gap-2">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search order # or customer…"
            className="w-64"
          />
          <SelectField
            value={status}
            onChange={setStatus}
            options={[
              { value: "", label: "All statuses" },
              ...ALL_STATUSES.map((s) => ({ value: s, label: s })),
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <AdminTableSkeleton columns={6} />
      ) : isError ? (
        <PageError message="We couldn't load orders." />
      ) : orders.length === 0 ? (
        <div className="rounded-box border border-dashed border-base-300 bg-base-100 py-16 text-center text-base-content/60">
          No orders match.
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
                      #{formatOrderNumber(order.orderNumber)}
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
                    {order.requestedStatus ? (
                      <div className="mt-1 text-xs text-warning">
                        {order.requestedStatus} requested
                      </div>
                    ) : null}
                  </td>
                  <td className="text-sm text-base-content/60">{formatOrderWhen(order.createdAt)}</td>
                  <td>
                    <OrderStaffControls
                      order={order}
                      onChangeStatus={(status) => handleStatusChange(order.id, status)}
                      onDismissRequest={() => dismissRequest.mutate(order.id)}
                      statusPending={updateStatus.isPending}
                      dismissPending={dismissRequest.isPending}
                      error={errorForId === order.id ? "Couldn't update status" : null}
                      size="sm"
                    />
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
