import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useOrders() {
  const { getToken, isSignedIn } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: () => apiFetch("/api/orders", { getToken }),
    enabled: isSignedIn,
  });

  return {
    orders: data?.orders ?? [],
    isLoading: isSignedIn && isLoading,
    isError,
    isSignedIn,
  };
}
