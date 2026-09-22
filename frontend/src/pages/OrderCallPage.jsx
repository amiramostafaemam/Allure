import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeftIcon, VideoIcon } from "lucide-react";
import {
  StreamVideoClient,
  StreamVideo,
  StreamCall,
  SpeakerLayout,
  CallControls,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useOrderDetail } from "../hooks/useOrderDetail";
import { useStreamToken } from "../hooks/useStreamToken";
import { OrderVideoSkeleton } from "../components/LoadingSkeletons";
import PageError from "../components/PageError";
import { isChatEligible } from "../utils/orderStatus";
import { formatOrderNumber } from "../utils/format";

function OrderCallPage() {
  const {
    orderId,
    order,
    isLoading: orderLoading,
    isError: orderError,
  } = useOrderDetail();

  const {
    data: streamAuth,
    isLoading: tokenLoading,
    isError: tokenError,
  } = useStreamToken(Boolean(order));

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [joinError, setJoinError] = useState(false);

  useEffect(() => {
    if (!streamAuth || !order) return;

    let cancelled = false;
    const videoClient = new StreamVideoClient({
      apiKey: streamAuth.apiKey,
      user: { id: streamAuth.userId },
      token: streamAuth.token,
    });
    const videoCall = videoClient.call("default", orderId);

    videoCall
      .join({ create: true })
      .then(() => {
        if (cancelled) return;
        setClient(videoClient);
        setCall(videoCall);
      })
      .catch(() => {
        if (!cancelled) setJoinError(true);
      });

    return () => {
      cancelled = true;
      videoCall.leave().catch(() => {});
      videoClient.disconnectUser();
    };
  }, [streamAuth, order, orderId]);

  if (orderError || (!orderLoading && (!order || !isChatEligible(order.status)))) {
    return (
      <PageError
        message="This order isn't available for a video call."
        action={{ to: "/orders", label: "Back to orders" }}
      />
    );
  }

  if (tokenError || joinError) {
    return (
      <PageError message="We couldn't connect the video call. Please try again shortly." />
    );
  }

  if (orderLoading || tokenLoading || !call) {
    return <OrderVideoSkeleton />;
  }

  return (
    <div className="space-y-4">
      <Link
        to={`/orders/${orderId}`}
        className="btn btn-ghost btn-sm gap-2 px-2 text-base-content/70"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Back to order
      </Link>

      <div className="overflow-hidden rounded-2xl border border-base-300 bg-neutral shadow-lg">
        <div className="flex items-center gap-3 border-b border-base-300/20 bg-neutral-focus/40 px-5 py-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary">
            <VideoIcon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-content">
              Order #{formatOrderNumber(order.orderNumber)}
            </p>
            <p className="text-xs text-neutral-content/60">Support video call</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-error/15 px-2.5 py-1 text-xs font-medium text-error">
            <span className="size-1.5 animate-pulse rounded-full bg-error" aria-hidden />
            Live
          </span>
        </div>

        <div className="min-h-[60vh]">
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <SpeakerLayout />
              <CallControls />
            </StreamCall>
          </StreamVideo>
        </div>
      </div>
    </div>
  );
}

export default OrderCallPage;
