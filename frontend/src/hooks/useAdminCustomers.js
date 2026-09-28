import { useAuth } from "@clerk/react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { ADMIN_PAGE_SIZE } from "./useAdminProducts";

export function useAdminCustomers({ page = 1 } = {}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-customers", page],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("limit", String(ADMIN_PAGE_SIZE));
      params.set("offset", String((page - 1) * ADMIN_PAGE_SIZE));
      return apiFetch(`/api/admin/customers?${params.toString()}`, { getToken });
    },
    placeholderData: keepPreviousData,
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }) =>
      apiFetch(`/api/admin/customers/${id}/role`, { getToken, method: "PATCH", body: { role } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-customers"] }),
  });

  return {
    customers: data?.customers ?? [],
    total: data?.total ?? 0,
    limit: ADMIN_PAGE_SIZE,
    isLoading,
    isError,
    updateRole,
  };
}
