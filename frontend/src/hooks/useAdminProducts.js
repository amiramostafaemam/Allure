import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useAdminProducts({ q = "" } = {}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-products", q],
    queryFn: () =>
      apiFetch(`/api/admin/products${q ? `?q=${encodeURIComponent(q)}` : ""}`, { getToken }),
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
    isLoading,
    isError,
    createProduct,
    updateProduct,
    deleteProduct,
    saveVariants,
  };
}
