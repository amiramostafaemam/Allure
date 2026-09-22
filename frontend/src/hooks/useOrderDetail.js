import { useState } from "react";
import { useParams } from "react-router";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useOrderDetail() {
  const { id } = useParams();
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [inviteSent, setInviteSent] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => apiFetch(`/api/orders/${id}`, { getToken }),
    enabled: isSignedIn,
  });

  const sendVideoInvite = useMutation({
    mutationFn: () =>
      apiFetch(`/api/orders/${id}/video-invite`, {
        getToken,
        method: "POST",
      }),
    onSuccess: () => {
      setInviteSent(true);
      queryClient.invalidateQueries({ queryKey: ["order", id] });
    },
  });

  const requestAction = useMutation({
    mutationFn: ({ status, note }) =>
      apiFetch(`/api/orders/${id}/request`, {
        getToken,
        method: "POST",
        body: { status, ...(note ? { note } : {}) },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order", id] }),
  });

  const invalidateOrder = () => {
    queryClient.invalidateQueries({ queryKey: ["order", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const updateStatus = useMutation({
    mutationFn: ({ status, note }) =>
      apiFetch(`/api/admin/orders/${id}/status`, {
        getToken,
        method: "PATCH",
        body: { status, ...(note ? { note } : {}) },
      }),
    onSuccess: invalidateOrder,
  });

  const dismissRequest = useMutation({
    mutationFn: () => apiFetch(`/api/admin/orders/${id}/dismiss-request`, { getToken, method: "PATCH" }),
    onSuccess: invalidateOrder,
  });

  return {
    orderId: id,
    order: data?.order ?? null,
    items: data?.orderItemsRows ?? [],
    statusEvents: data?.statusEvents ?? [],
    isLoading: isSignedIn && isLoading,
    isError,
    isSignedIn,
    sendVideoInvite: () => sendVideoInvite.mutate(),
    sendingInvite: sendVideoInvite.isPending,
    inviteError: sendVideoInvite.isError,
    inviteSent,
    requestAction,
    updateStatus,
    dismissRequest,
  };
}
