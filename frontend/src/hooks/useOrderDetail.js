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

  return {
    orderId: id,
    order: data?.order ?? null,
    items: data?.orderItemsRows ?? [],
    isLoading: isSignedIn && isLoading,
    isError,
    isSignedIn,
    sendVideoInvite: () => sendVideoInvite.mutate(),
    sendingInvite: sendVideoInvite.isPending,
    inviteError: sendVideoInvite.isError,
    inviteSent,
  };
}
