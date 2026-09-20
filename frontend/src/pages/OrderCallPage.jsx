import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeftIcon } from "lucide-react";
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

  if (orderError || (!orderLoading && (!order || order.status !== "paid"))) {
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

      <div className="min-h-[60vh] overflow-hidden rounded-box border border-base-300 bg-neutral">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <SpeakerLayout />
            <CallControls />
          </StreamCall>
        </StreamVideo>
      </div>
    </div>
  );
}

export default OrderCallPage;
