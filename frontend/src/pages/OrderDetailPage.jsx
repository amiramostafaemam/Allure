import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeftIcon, BanIcon, LogInIcon, MapPinIcon, PhoneIcon, RotateCcwIcon, VideoIcon } from "lucide-react";
import { SignInButton } from "@clerk/react";
import { useOrderDetail } from "../hooks/useOrderDetail";
import { useMe } from "../hooks/useMe";
import { OrderChatPanel } from "../components/OrderChatPanel";
import OrderTimeline from "../components/OrderTimeline";
import { OrderStaffControls } from "../components/OrderStaffControls";
import { TextAreaField } from "../components/FormField";
import { OrderDetailSkeleton } from "../components/LoadingSkeletons";
import PageError from "../components/PageError";
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl";
import { formatOrderNumber, formatOrderWhen, formatPrice } from "../utils/format";
import { isChatEligible, nextStatusOptions, requestableStatusOptions, statusBadgeClass } from "../utils/orderStatus";

const REQUEST_LABEL = { cancelled: "cancellation", refunded: "refund" };
const REQUEST_ICON = { cancelled: BanIcon, refunded: RotateCcwIcon };

function OrderRequestPanel({ order, requestAction }) {
  const [pendingStatus, setPendingStatus] = useState(null);
  const [note, setNote] = useState("");

  if (order.requestedStatus) {
    return (
      <div className="card border border-dashed border-warning/40 bg-warning/5">
        <div className="card-body">
          <h3 className="font-semibold text-base-content">
            {REQUEST_LABEL[order.requestedStatus]} requested
          </h3>
          <p className="text-sm text-base-content/65">
            You asked for a {REQUEST_LABEL[order.requestedStatus]} on{" "}
            {formatOrderWhen(order.requestedAt)}. Our team will review it shortly.
          </p>
          {order.requestedNote ? (
            <p className="text-sm italic text-base-content/60">"{order.requestedNote}"</p>
          ) : null}
        </div>
      </div>
    );
  }

  const options = requestableStatusOptions(order.status);
  if (options.length === 0) return null;

  return (
    <div className="card border border-base-300 bg-base-100">
      <div className="card-body gap-3">
        <h3 className="font-semibold text-base-content">Need something changed?</h3>

        {pendingStatus ? (
          <div className="space-y-3">
            <TextAreaField
              label="Note for our team"
              optional
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setPendingStatus(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={requestAction.isPending}
                onClick={() => {
                  requestAction.mutate(
                    { status: pendingStatus, note: note.trim() || undefined },
                    { onSuccess: () => setPendingStatus(null) },
                  );
                }}
              >
                {requestAction.isPending ? "Sending…" : `Submit ${REQUEST_LABEL[pendingStatus]} request`}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {options.map((status) => {
              const Icon = REQUEST_ICON[status];
              return (
                <button
                  key={status}
                  type="button"
                  className="btn btn-sm btn-outline gap-2"
                  onClick={() => setPendingStatus(status)}
                >
                  <Icon className="size-4" aria-hidden />
                  Request {REQUEST_LABEL[status]}
                </button>
              );
            })}
          </div>
        )}

        {requestAction.isError ? (
          <p className="text-sm text-error">Couldn't send the request. Try again.</p>
        ) : null}
      </div>
    </div>
  );
}

function OrderDetailPage() {
  const {
    orderId,
    order,
    items,
    statusEvents,
    isLoading,
    isError,
    isSignedIn,
    sendVideoInvite,
    sendingInvite,
    inviteError,
    inviteSent,
    requestAction,
    updateStatus,
    dismissRequest,
  } = useOrderDetail();
  const { role } = useMe();
  const isStaff = role === "support" || role === "admin";
  const [staffActionError, setStaffActionError] = useState(false);

  async function handleStaffStatusChange(status) {
    setStaffActionError(false);
    try {
      await updateStatus.mutateAsync({ status });
    } catch {
      setStaffActionError(true);
    }
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-16 text-center">
        <p className="text-base-content/60">Sign in to view this order.</p>
        <SignInButton mode="modal">
          <button type="button" className="btn btn-primary mt-6 gap-2 shadow-md">
            <LogInIcon className="size-4" aria-hidden />
            Sign in
          </button>
        </SignInButton>
      </div>
    );
  }

  if (isLoading) return <OrderDetailSkeleton />;

  if (isError || !order) {
    return (
      <PageError
        message="We couldn't find this order."
        action={{ to: "/orders", label: "Back to orders" }}
      />
    );
  }

  return (
    <div className="space-y-8 text-left">
      <Link
        to="/orders"
        className="btn btn-ghost btn-sm gap-2 px-2 text-base-content/70"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Back to orders
      </Link>

      {isStaff && (order.requestedStatus || nextStatusOptions(order.status).length > 0) ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-secondary/40 bg-secondary/5 px-5 py-4">
          <div>
            <h3 className="font-semibold text-base-content">Staff controls</h3>
            <p className="text-sm text-base-content/65">
              {order.requestedStatus
                ? `Customer requested "${order.requestedStatus}".`
                : "Change this order's status directly from here."}
            </p>
          </div>
          <OrderStaffControls
            order={order}
            onChangeStatus={handleStaffStatusChange}
            onDismissRequest={() => dismissRequest.mutate()}
            statusPending={updateStatus.isPending}
            dismissPending={dismissRequest.isPending}
            error={staffActionError ? "Couldn't update status" : null}
            size="md"
          />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-lg">
        <div className="flex flex-col gap-6 bg-base-200/50 px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-8 sm:py-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
              Order
            </p>
            <h1 className="mt-1 text-2xl font-bold text-base-content sm:text-3xl">
              #{formatOrderNumber(order.orderNumber)}
            </h1>
            <p className="mt-1 text-sm text-base-content/60">
              Placed {formatOrderWhen(order.createdAt)}
            </p>
          </div>

          <div className="space-y-3 border-t border-base-300/80 pt-4 sm:border-t-0 sm:pt-0 sm:text-right">
            <span
              className={`badge capitalize ${statusBadgeClass(order.status)}`}
            >
              {order.status}
            </span>
            <p className="text-2xl font-bold tabular-nums text-base-content">
              {formatPrice(order.totalPounds, "egp")}
            </p>
          </div>
        </div>

        <ul className="divide-y divide-base-300 border-t border-base-300">
          {items.map((row) => (
            <li
              key={row.orderId}
              className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-8"
            >
              <div className="size-16 shrink-0 overflow-hidden rounded-box bg-base-300">
                {row.product?.imageUrl ? (
                  <img
                    src={imageKitOptimizedUrl(
                      row.product.imageUrl,
                      IK_PRESETS.orderLineThumb,
                    )}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                {row.product ? (
                  <Link
                    to={`/product/${row.product.slug}`}
                    className="link-hover link-primary font-medium"
                  >
                    {row.product.name}
                  </Link>
                ) : (
                  <span className="font-medium">Unknown product</span>
                )}
                <p className="text-sm text-base-content/60">
                  {formatPrice(row.unitPricePounds, "egp")} × {row.quantity}
                </p>
              </div>

              <div className="font-semibold tabular-nums text-base-content">
                {formatPrice(row.unitPricePounds * row.quantity, "egp")}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <OrderTimeline order={order} statusEvents={statusEvents} />

      {order.shippingAddress ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-base-content/60">
            <MapPinIcon className="size-4" aria-hidden />
            Shipping address
          </h3>
          <div className="mt-3 space-y-2 text-sm">
            <p className="font-medium text-base-content">{order.shippingAddress.fullName}</p>
            <p className="flex items-center gap-1.5 text-base-content/70">
              <PhoneIcon className="size-3.5 shrink-0" aria-hidden />
              {order.shippingAddress.phone}
            </p>
            <p className="text-base-content/70">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.governorate}
              <br />
              {order.shippingAddress.country}
            </p>
          </div>
        </div>
      ) : null}

      {!isStaff ? <OrderRequestPanel order={order} requestAction={requestAction} /> : null}

      {isStaff ? (
        <div className="card border border-dashed border-secondary/40 bg-secondary/5">
          <div className="card-body flex-row flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-base-content">Staff tools</h3>
              <p className="text-sm text-base-content/65">
                Send a video call link into this order's support chat.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary gap-2"
              onClick={sendVideoInvite}
              disabled={sendingInvite || !isChatEligible(order.status)}
            >
              <VideoIcon className="size-4" aria-hidden />
              {sendingInvite
                ? "Sending…"
                : inviteSent
                  ? "Invite sent"
                  : "Send video invite"}
            </button>
          </div>
          {inviteError ? (
            <p className="px-6 pb-4 text-sm text-error">
              Couldn't send the invite. Try again.
            </p>
          ) : null}
        </div>
      ) : null}

      {isChatEligible(order.status) ? (
        <OrderChatPanel orderId={orderId} />
      ) : (
        <div className="rounded-box border border-dashed border-base-300 bg-base-100 p-6 text-center text-sm text-base-content/60">
          Support chat opens once this order is paid.
        </div>
      )}
    </div>
  );
}

export default OrderDetailPage;
