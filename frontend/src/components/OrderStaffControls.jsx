import { nextStatusOptions } from "../utils/orderStatus";

// Shared between AdminOrdersPage's table row and OrderDetailPage's top
// panel, so approving/rejecting a request or changing status works
// identically whether staff got here from the dashboard or from a
// notification click straight into the order.
export function OrderStaffControls({
  order,
  onChangeStatus,
  onDismissRequest,
  statusPending,
  dismissPending,
  error,
  size = "sm",
}) {
  const selectSize = size === "sm" ? "select-xs" : "select-sm";
  const btnSize = size === "sm" ? "btn-xs" : "btn-sm";

  return (
    <div className="flex flex-col items-end gap-1">
      {order.requestedStatus ? (
        <div className="flex gap-2">
          <button
            type="button"
            className={`btn btn-primary ${btnSize}`}
            disabled={statusPending}
            onClick={() => onChangeStatus(order.requestedStatus)}
          >
            Approve
          </button>
          <button
            type="button"
            className={`btn ${btnSize}`}
            disabled={dismissPending}
            onClick={onDismissRequest}
          >
            Dismiss
          </button>
        </div>
      ) : (
        (() => {
          const options = nextStatusOptions(order.status);
          if (options.length === 0) return null;
          return (
            <select
              className={`select select-bordered ${selectSize}`}
              value=""
              disabled={statusPending}
              onChange={(e) => {
                if (e.target.value) onChangeStatus(e.target.value);
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
        })()
      )}
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
