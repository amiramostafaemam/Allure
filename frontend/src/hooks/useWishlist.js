import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

const QUERY_KEY = ["wishlist"];

export function useWishlist() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch("/api/wishlist", { getToken }),
    enabled: isSignedIn,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  // The heart's color is the only feedback a click gives — waiting for a
  // full round trip (request, response, refetch) before it updates reads
  // as broken/laggy, not just slow. Patch the cache immediately and only
  // reconcile with the server afterward; roll back if the request actually
  // fails. A bare {id} placeholder is enough for "add" — nothing renders
  // full product fields from this cache except the wishlist page itself,
  // and adding never happens from there (everything shown is already
  // saved, so only remove — a plain filter, no placeholder needed — is
  // reachable from that screen).
  const addItem = useMutation({
    mutationFn: (productId) =>
      apiFetch("/api/wishlist", { getToken, method: "POST", body: { productId } }),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData(QUERY_KEY);
      queryClient.setQueryData(QUERY_KEY, (old) => {
        const items = old?.items ?? [];
        if (items.some((p) => p.id === productId)) return old;
        return { items: [...items, { id: productId }] };
      });
      return { previous };
    },
    onError: (_err, _productId, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
    },
    onSettled: invalidate,
  });

  const removeItem = useMutation({
    mutationFn: (productId) =>
      apiFetch(`/api/wishlist/${productId}`, { getToken, method: "DELETE" }),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData(QUERY_KEY);
      queryClient.setQueryData(QUERY_KEY, (old) => ({
        items: (old?.items ?? []).filter((p) => p.id !== productId),
      }));
      return { previous };
    },
    onError: (_err, _productId, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
    },
    onSettled: invalidate,
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
