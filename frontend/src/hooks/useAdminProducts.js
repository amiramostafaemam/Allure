import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useAdminProducts() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => apiFetch("/api/admin/products", { getToken }),
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

  return {
    products: data?.products ?? [],
    isLoading,
    isError,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
