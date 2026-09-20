import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

/** {token, apiKey, userId} usable for both Stream Chat and Stream Video. */
export function useStreamToken(enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["stream-token"],
    queryFn: () => apiFetch("/api/stream/token", { getToken, method: "POST" }),
    enabled: enabled && isSignedIn,
    staleTime: 50 * 60 * 1000,
  });
}
