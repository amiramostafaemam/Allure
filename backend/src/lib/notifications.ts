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

type NotificationRow = {
  id: string;
  orderId: string;
  message: string;
  read: boolean;
  createdAt: Date;
};

export type NotificationGroup = {
  orderId: string;
  message: string;
  count: number;
  read: boolean;
  ids: string[];
  createdAt: Date;
};

// Collapses one-row-per-notification into one entry per order: the latest
// message, a count of how many notifications are bundled, and "read" only
// once every row in the group is read. Input must already be sorted newest
// first (desc createdAt) — the first row seen per orderId becomes the
// group's headline, everything else just adds to its count/ids/read state.
export function groupNotificationsByOrder(rows: NotificationRow[]): NotificationGroup[] {
  const groups = new Map<string, NotificationGroup>();
  const order: string[] = [];

  for (const row of rows) {
    const existing = groups.get(row.orderId);
    if (!existing) {
      groups.set(row.orderId, {
        orderId: row.orderId,
        message: row.message,
        count: 1,
        read: row.read,
        ids: [row.id],
        createdAt: row.createdAt,
      });
      order.push(row.orderId);
    } else {
      existing.count += 1;
      existing.read = existing.read && row.read;
      existing.ids.push(row.id);
    }
  }

  return order.map((orderId) => groups.get(orderId)!);
}
