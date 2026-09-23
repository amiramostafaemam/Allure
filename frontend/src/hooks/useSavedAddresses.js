import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useSavedAddresses() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["saved-addresses"],
    queryFn: () => apiFetch("/api/addresses", { getToken }),
    enabled: isSignedIn,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });

  const createAddress = useMutation({
    mutationFn: (address) =>
      apiFetch("/api/addresses", { getToken, method: "POST", body: address }),
    onSuccess: invalidate,
  });

  const deleteAddress = useMutation({
    mutationFn: (id) => apiFetch(`/api/addresses/${id}`, { getToken, method: "DELETE" }),
    onSuccess: invalidate,
  });

  return {
    addresses: data?.addresses ?? [],
    isLoading,
    createAddress,
    deleteAddress,
  };
}
