import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import {
  Chat,
  Channel,
  Window,
  MessageList,
  MessageComposer,
  MessageUI,
  useMessageContext,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";
import { VideoIcon, MessageCircleIcon } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useStreamToken } from "../hooks/useStreamToken";
import { OrderChatPanelSkeleton } from "./LoadingSkeletons";
import PageError from "./PageError";

// Support sends a chat message carrying { video_invite: true, join_url } —
// render it as a call-to-action button instead of plain message text.
function VideoInviteMessage(props) {
  const { message } = useMessageContext();
  if (message?.video_invite && message?.join_url) {
    return (
      <div className="my-3 flex justify-center">
        <a
          href={message.join_url}
          className="btn btn-primary btn-sm gap-2 shadow"
        >
          <VideoIcon className="size-4" aria-hidden />
          Join video call
        </a>
      </div>
    );
  }
  return <MessageUI {...props} />;
}

export function OrderChatPanel({ orderId }) {
  const { getToken } = useAuth();
  const {
    data: streamAuth,
    isLoading: tokenLoading,
    isError: tokenError,
  } = useStreamToken();

  const {
    data: channelInfo,
    isLoading: channelLoading,
    isError: channelError,
  } = useQuery({
    queryKey: ["order-stream-channel", orderId],
    queryFn: () =>
      apiFetch(`/api/orders/${orderId}/stream-channel`, {
        getToken,
        method: "POST",
      }),
    enabled: Boolean(orderId),
  });

  const [client, setClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [connectError, setConnectError] = useState(false);

  useEffect(() => {
    if (!streamAuth || !channelInfo) return;

    let cancelled = false;
    const chatClient = StreamChat.getInstance(streamAuth.apiKey);

    async function connect() {
      try {
        await chatClient.connectUser(
          { id: streamAuth.userId },
          streamAuth.token,
        );
        if (cancelled) return;

        const ch = chatClient.channel(
          channelInfo.channelType,
          channelInfo.channelId,
        );
        await ch.watch();
        if (cancelled) return;

        setClient(chatClient);
        setChannel(ch);
      } catch {
        if (!cancelled) setConnectError(true);
      }
    }
    connect();

    return () => {
      cancelled = true;
      chatClient.disconnectUser();
    };
  }, [streamAuth, channelInfo]);

  if (tokenLoading || channelLoading || (!channel && !connectError)) {
    return <OrderChatPanelSkeleton />;
  }

  if (tokenError || channelError || connectError) {
    return (
      <PageError message="Support chat is unavailable right now. Please try again shortly." />
    );
  }

  return (
    <div className="space-y-4">
      <div className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body flex-row flex-wrap items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-box bg-primary/10 text-primary">
            <MessageCircleIcon className="size-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-base-content">
              Order support chat
            </h3>
            <p className="text-sm text-base-content/65">
              Ask questions about this order. Video call invites from our
              team will appear here.
            </p>
          </div>
        </div>
      </div>

      <div className="h-140 overflow-hidden rounded-box border border-base-300">
        <Chat client={client}>
          <Channel channel={channel}>
            <Window>
              <MessageList Message={VideoInviteMessage} />
              <MessageComposer />
            </Window>
          </Channel>
        </Chat>
      </div>
    </div>
  );
}
