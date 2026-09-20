import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useAdminCustomers() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => apiFetch("/api/admin/customers", { getToken }),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }) =>
      apiFetch(`/api/admin/customers/${id}/role`, { getToken, method: "PATCH", body: { role } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-customers"] }),
  });

  return {
    customers: data?.customers ?? [],
    isLoading,
    isError,
    updateRole,
  };
}
