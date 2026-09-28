import { useAuth } from "@clerk/react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export const ADMIN_PAGE_SIZE = 20;

export function useAdminProducts({ q = "", page = 1 } = {}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-products", q, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("limit", String(ADMIN_PAGE_SIZE));
      params.set("offset", String((page - 1) * ADMIN_PAGE_SIZE));
      return apiFetch(`/api/admin/products?${params.toString()}`, { getToken });
    },
    placeholderData: keepPreviousData,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });

  const createProduct = useMutation({
    mutationFn: (body) =>
      apiFetch("/api/admin/products", { getToken, method: "POST", body }),
    onSuccess: invalidate,
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, ...body }) =>
      apiFetch(`/api/admin/products/${id}`, {
        getToken,
        method: "PATCH",
        body,
      }),
    onSuccess: invalidate,
  });

  const deleteProduct = useMutation({
    mutationFn: (id) =>
      apiFetch(`/api/admin/products/${id}`, { getToken, method: "DELETE" }),
    onSuccess: invalidate,
  });

  const saveVariants = useMutation({
    mutationFn: ({ productId, variantName, variants }) =>
      apiFetch(`/api/admin/products/${productId}/variants`, {
        getToken,
        method: "PUT",
        body: { variantName, variants },
      }),
    onSuccess: invalidate,
  });

  return {
    products: data?.products ?? [],
    total: data?.total ?? 0,
    limit: ADMIN_PAGE_SIZE,
    isLoading,
    isError,
    createProduct,
    updateProduct,
    deleteProduct,
    saveVariants,
  };
}

export function useAdminProduct(id) {
  const { getToken } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-products", id],
    queryFn: () => apiFetch(`/api/admin/products/${id}`, { getToken }),
    enabled: Boolean(id),
  });

  return {
    product: data?.product ?? null,
    isLoading,
    isError,
  };
}
