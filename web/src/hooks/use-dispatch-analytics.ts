"use client";

import { useQuery } from "./use-query";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";

export function useDispatchAnalytics() {
  const { data, status } = useQuery(api.dispatches.getRecentDispatches, {
    limit: 5,
  });
  const { data: dispatchStats, status: dispatchStatsStatus } = useQuery(
    api.dispatches.getDispatchStats,
    {},
  );

  return {
    loading: status === "pending" || dispatchStatsStatus === "pending",
    dispatches: data,
    totalDispatches: dispatchStats?.total,
    counts: dispatchStats?.counts,
    todaysDispatches: dispatchStats?.todaysDispatches,
    hours: dispatchStats?.hours,
  };
}
