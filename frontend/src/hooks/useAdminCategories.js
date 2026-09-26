import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useAdminCategories() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => apiFetch("/api/admin/categories", { getToken }),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });

  const createCategory = useMutation({
    mutationFn: (name) =>
      apiFetch("/api/admin/categories", { getToken, method: "POST", body: { name } }),
    onSuccess: invalidate,
  });

  const renameCategory = useMutation({
    mutationFn: ({ id, ...body }) =>
      apiFetch(`/api/admin/categories/${id}`, { getToken, method: "PATCH", body }),
    onSuccess: invalidate,
  });

  const deleteCategory = useMutation({
    mutationFn: (id) =>
      apiFetch(`/api/admin/categories/${id}`, { getToken, method: "DELETE" }),
    onSuccess: invalidate,
  });

  return {
    categories: data?.categories ?? [],
    isLoading,
    isError,
    createCategory,
    renameCategory,
    deleteCategory,
  };
}
