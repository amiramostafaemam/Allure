import { useAuth } from "@clerk/react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { ADMIN_PAGE_SIZE } from "./useAdminProducts";

export function useAdminPromoCodes({ page = 1 } = {}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-promo-codes", page],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("limit", String(ADMIN_PAGE_SIZE));
      params.set("offset", String((page - 1) * ADMIN_PAGE_SIZE));
      return apiFetch(`/api/admin/promo-codes?${params.toString()}`, { getToken });
    },
    placeholderData: keepPreviousData,
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
    total: data?.total ?? 0,
    limit: ADMIN_PAGE_SIZE,
    isLoading,
    isError,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
  };
}
