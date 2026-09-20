import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useMe() {
  const { getToken, isSignedIn } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch("/api/me", { getToken }),
    enabled: isSignedIn,
  });

  const role = data?.role?.trim?.().toLowerCase();

  return { me: data, role, isLoading };
}
