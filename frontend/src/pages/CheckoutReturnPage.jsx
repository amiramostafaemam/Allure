import { Link } from "react-router";
import {
  CheckCircle2Icon,
  LoaderIcon,
  PackageIcon,
  XCircleIcon,
} from "lucide-react";
import { useCheckoutReturn } from "../hooks/useCheckoutReturn";
import PageError from "../components/PageError";

function CheckoutReturnPage() {
  const { checkoutId, order, isLoading, isError, pending, timedOut } =
    useCheckoutReturn();

  if (!checkoutId) {
    return (
      <PageError
        message="Missing checkout reference. If you just paid, check your orders page."
        action={{ to: "/orders", label: "View orders" }}
      />
    );
  }

  if (isError) {
    return (
      <PageError
        message="We couldn't confirm your order right now. Check your orders page in a moment."
        action={{ to: "/orders", label: "View orders" }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-base-300 bg-base-100 px-6 py-14 text-center shadow-md sm:px-10">
      {isLoading || pending ? (
        <>
          <LoaderIcon
            className="mx-auto mb-6 size-12 animate-spin text-primary"
            aria-hidden
          />
          <h1 className="text-xl font-semibold text-base-content sm:text-2xl">
            Confirming your payment…
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-base-content/65">
            This usually takes a few seconds. Don&apos;t close this page.
          </p>
        </>
      ) : order ? (
        <>
          <CheckCircle2Icon
            className="mx-auto mb-6 size-14 text-success"
            aria-hidden
          />
          <h1 className="text-xl font-semibold text-base-content sm:text-2xl">
            Payment confirmed
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-base-content/65">
            Your order is paid. Open it any time for support chat and video
            calls with our team.
          </p>
          <Link
            to={`/orders/${order.id}`}
            className="btn btn-primary mt-8 gap-2 shadow-md"
          >
            <PackageIcon className="size-4" aria-hidden />
            View order
          </Link>
        </>
      ) : timedOut ? (
        <>
          <XCircleIcon
            className="mx-auto mb-6 size-14 text-warning"
            aria-hidden
          />
          <h1 className="text-xl font-semibold text-base-content sm:text-2xl">
            Still processing
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-base-content/65">
            Your payment is taking longer than usual to confirm. It will
            appear on your orders page as soon as it's ready.
          </p>
          <Link to="/orders" className="btn btn-outline btn-primary mt-8">
            View orders
          </Link>
        </>
      ) : null}
    </div>
  );
}

export default CheckoutReturnPage;
