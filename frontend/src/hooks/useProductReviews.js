import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useProductReviews(slug) {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["product-reviews", slug],
    queryFn: () => apiFetch(`/api/products/${encodeURIComponent(slug)}/reviews`, { getToken }),
    enabled: Boolean(slug),
  });

  const createReview = useMutation({
    mutationFn: ({ rating, comment }) =>
      apiFetch(`/api/products/${encodeURIComponent(slug)}/reviews`, {
        getToken,
        method: "POST",
        body: { rating, ...(comment ? { comment } : {}) },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["product-reviews", slug] }),
  });

  return {
    reviews: data?.reviews ?? [],
    averageRating: data?.averageRating ?? null,
    count: data?.count ?? 0,
    canReview: isSignedIn ? Boolean(data?.canReview) : false,
    isLoading,
    createReview,
  };
}
