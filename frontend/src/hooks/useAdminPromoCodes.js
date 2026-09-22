import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useAdminPromoCodes() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-promo-codes"],
    queryFn: () => apiFetch("/api/admin/promo-codes", { getToken }),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });

  const createPromoCode = useMutation({
    mutationFn: (body) =>
      apiFetch("/api/admin/promo-codes", { getToken, method: "POST", body }),
    onSuccess: invalidate,
  });

  const updatePromoCode = useMutation({
    mutationFn: ({ id, ...body }) =>
      apiFetch(`/api/admin/promo-codes/${id}`, { getToken, method: "PATCH", body }),
    onSuccess: invalidate,
  });

  const deletePromoCode = useMutation({
    mutationFn: (id) =>
      apiFetch(`/api/admin/promo-codes/${id}`, { getToken, method: "DELETE" }),
    onSuccess: invalidate,
  });

  return {
    promoCodes: data?.promoCodes ?? [],
    isLoading,
    isError,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
  };
}
