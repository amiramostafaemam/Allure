import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useAdminOrders({ status = "", q = "" } = {}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-orders", status, q],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("scope", "staff");
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      return apiFetch(`/api/orders?${params.toString()}`, { getToken });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, note }) =>
      apiFetch(`/api/admin/orders/${id}/status`, {
        getToken,
        method: "PATCH",
        body: { status, ...(note ? { note } : {}) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const dismissRequest = useMutation({
    mutationFn: (id) =>
      apiFetch(`/api/admin/orders/${id}/dismiss-request`, { getToken, method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  return {
    orders: data?.orders ?? [],
    isLoading,
    isError,
    updateStatus,
    dismissRequest,
  };
}
