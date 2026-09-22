import { Link } from "react-router";
import { LogInIcon, PackageIcon, ChevronRightIcon } from "lucide-react";
import { SignInButton } from "@clerk/react";
import { useOrders } from "../hooks/useOrders";
import { OrdersListSkeleton } from "../components/LoadingSkeletons";
import PageError from "../components/PageError";
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl";
import { formatOrderNumber, formatOrderWhen, formatPrice } from "../utils/format";
import { statusBadgeClass } from "../utils/orderStatus";

function OrdersPage() {
  const { orders, isLoading, isError, isSignedIn } = useOrders();

  return (
    <div className="text-left">
      <h1 className="mb-8 flex items-center gap-2 text-3xl font-bold text-base-content">
        <PackageIcon className="size-8 text-primary" aria-hidden />
        Your orders
      </h1>

      {!isSignedIn ? (
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-16 text-center">
          <p className="text-base-content/60">Sign in to see your orders.</p>
          <SignInButton mode="modal">
            <button type="button" className="btn btn-primary mt-6 gap-2 shadow-md">
              <LogInIcon className="size-4" aria-hidden />
              Sign in
            </button>
          </SignInButton>
        </div>
      ) : isLoading ? (
        <OrdersListSkeleton />
      ) : isError ? (
        <PageError message="We couldn't load your orders. Please try again in a moment." />
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-16 text-center">
          <p className="text-base-content/60">You haven&apos;t placed any orders yet.</p>
          <Link to="/" className="btn btn-primary mt-6 gap-2 shadow-md">
            Browse catalog
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to={`/orders/${order.id}`}
                className="card border border-base-300 bg-base-100 shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="card-body flex-row flex-wrap items-center gap-4 py-5 sm:gap-5">
                  <div className="flex -space-x-3">
                    {(order.previewItems?.length
                      ? order.previewItems
                      : [null]
                    )
                      .slice(0, 4)
                      .map((item, i) => (
                        <div
                          key={i}
                          className="size-14 shrink-0 overflow-hidden rounded-xl border-2 border-base-100 bg-base-300 shadow-sm sm:size-16"
                        >
                          {item?.imageUrl ? (
                            <img
                              src={imageKitOptimizedUrl(
                                item.imageUrl,
                                IK_PRESETS.orderPreviewMd,
                              )}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                      ))}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-base-content">
                      Order #{formatOrderNumber(order.orderNumber)}
                    </p>
                    <p className="truncate text-sm text-base-content/60">
                      {order.previewItems?.length
                        ? order.previewItems
                            .map((i) => `${i.name} ×${i.quantity}`)
                            .join(", ")
                        : "No items"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`badge badge-sm capitalize ${statusBadgeClass(order.status)}`}
                      >
                        {order.status}
                      </span>
                      <span className="text-xs text-base-content/50">
                        {formatOrderWhen(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-semibold tabular-nums text-base-content">
                      {formatPrice(order.totalPounds, "egp")}
                    </span>
                    <ChevronRightIcon
                      className="size-5 text-base-content/40"
                      aria-hidden
                    />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default OrdersPage;
