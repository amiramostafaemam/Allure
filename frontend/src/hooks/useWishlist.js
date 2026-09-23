import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useWishlist() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => apiFetch("/api/wishlist", { getToken }),
    enabled: isSignedIn,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["wishlist"] });

  const addItem = useMutation({
    mutationFn: (productId) =>
      apiFetch("/api/wishlist", { getToken, method: "POST", body: { productId } }),
    onSuccess: invalidate,
  });

  const removeItem = useMutation({
    mutationFn: (productId) =>
      apiFetch(`/api/wishlist/${productId}`, { getToken, method: "DELETE" }),
    onSuccess: invalidate,
  });

  const items = data?.items ?? [];
  const wishlistedIds = new Set(items.map((p) => p.id));

  return {
    items,
    isLoading,
    isWishlisted: (productId) => wishlistedIds.has(productId),
    addItem,
    removeItem,
  };
}
