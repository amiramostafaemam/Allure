import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useAdminOrders() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => apiFetch("/api/orders", { getToken }),
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

  return {
    orders: data?.orders ?? [],
    isLoading,
    isError,
    updateStatus,
  };
}
