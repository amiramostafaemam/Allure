import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useAdminStats() {
  const { getToken } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch("/api/admin/stats", { getToken }),
  });

  return {
    revenuePounds: data?.revenuePounds ?? 0,
    totalOrders: data?.totalOrders ?? 0,
    totalCustomers: data?.totalCustomers ?? 0,
    ordersByStatus: data?.ordersByStatus ?? {},
    topProducts: data?.topProducts ?? [],
    recentOrders: data?.recentOrders ?? [],
    revenueByDay: data?.revenueByDay ?? [],
    isLoading,
    isError,
  };
}
