export function clerkUserIdFromStreamId(streamUserId: string): string | undefined {
  return streamUserId.startsWith("clerk_") ? streamUserId.slice("clerk_".length) : undefined;
}

export function orderIdFromChannelId(channelId: string): string | undefined {
  return channelId.startsWith("order-") ? channelId.slice("order-".length) : undefined;
}

export function messagePreview(text: string | undefined): string {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return "New message";
  return trimmed.length > 140 ? `${trimmed.slice(0, 140)}…` : trimmed;
}
