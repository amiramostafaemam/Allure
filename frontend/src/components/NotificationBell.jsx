import { Link } from "react-router";
import { BellIcon, CheckCheckIcon, MessageCircleIcon } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { formatOrderNumber, formatOrderWhen } from "../utils/format";

function NotificationBell() {
  const { notifications, unreadCount, markOrderRead, markAllRead } = useNotifications();

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-square indicator"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        onFocus={() => {
          if (unreadCount > 0 && !markAllRead.isPending) markAllRead.mutate();
        }}
      >
        {unreadCount > 0 ? (
          <span className="indicator-item badge badge-sm badge-primary min-w-2 px-1.5 font-sans text-xs tabular-nums">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
        <BellIcon className="size-6 opacity-90" aria-hidden />
      </div>

      {/* dropdown-end anchors the panel's right edge to the trigger and
          extends left by its own fixed width (w-80) — on a phone-width
          screen the trigger sits close enough to the edge that a 320px
          panel runs off the left of the viewport entirely. Below sm:,
          override to a fixed panel pinned to the viewport by its own
          margins instead of the trigger's position. */}
      <div
        tabIndex={0}
        className="dropdown-content menu z-10 mt-2 w-80 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg max-sm:fixed! max-sm:inset-x-4! max-sm:top-16! max-sm:mt-0! max-sm:w-auto!"
      >
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-sm font-semibold text-base-content">Notifications</span>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="btn btn-ghost btn-xs gap-1"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheckIcon className="size-3.5" aria-hidden />
              Mark all read
            </button>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-base-content/60">
            No notifications yet.
          </p>
        ) : (
          <ul className="no-scrollbar max-h-96 space-y-1 overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.orderId}>
                <Link
                  to={`/orders/${n.orderId}`}
                  onClick={() => {
                    if (!n.read) markOrderRead.mutate(n.orderId);
                  }}
                  className={`flex items-start gap-2 rounded-lg px-2 py-2 text-sm hover:bg-base-200 ${
                    n.read ? "text-base-content/60" : "font-medium text-base-content"
                  }`}
                >
                  <MessageCircleIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2">
                      {n.message}
                      {n.count > 1 ? (
                        <span className="ml-1 text-xs font-normal text-base-content/50">
                          ({n.count} messages)
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-xs font-normal text-base-content/50">
                      Order #{n.orderNumber != null ? formatOrderNumber(n.orderNumber) : "—"} ·{" "}
                      {formatOrderWhen(n.createdAt)}
                    </span>
                  </span>
                  {!n.read ? (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default NotificationBell;
