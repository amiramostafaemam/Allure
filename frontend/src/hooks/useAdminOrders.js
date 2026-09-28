import { useAuth } from "@clerk/react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { ADMIN_PAGE_SIZE } from "./useAdminProducts";

export function useAdminOrders({ status = "", q = "", page = 1 } = {}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-orders", status, q, page],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("scope", "staff");
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      params.set("limit", String(ADMIN_PAGE_SIZE));
      params.set("offset", String((page - 1) * ADMIN_PAGE_SIZE));
      return apiFetch(`/api/orders?${params.toString()}`, { getToken });
    },
    placeholderData: keepPreviousData,
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
    total: data?.total ?? 0,
    limit: ADMIN_PAGE_SIZE,
    isLoading,
    isError,
    updateStatus,
    dismissRequest,
  };
}
