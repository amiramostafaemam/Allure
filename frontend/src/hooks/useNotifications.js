import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

const POLL_INTERVAL_MS = 20 * 1000;

export function useNotifications() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/api/notifications", { getToken }),
    enabled: isSignedIn,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  // Marks every notification in a grouped bell entry (one order, possibly
  // several stacked chat messages) read in one call.
  const markOrderRead = useMutation({
    mutationFn: (orderId) =>
      apiFetch(`/api/notifications/order/${orderId}/read`, { getToken, method: "PATCH" }),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () =>
      apiFetch("/api/notifications/read-all", { getToken, method: "PATCH" }),
    onSuccess: invalidate,
  });

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    markOrderRead,
    markAllRead,
  };
}
