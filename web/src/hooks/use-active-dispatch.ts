import { api } from "@sizeupdashboard/convex/api/_generated/api";
import type { DispatchesSchema } from "@sizeupdashboard/convex/api/schema";
import { useQuery } from "./use-query";
import { useEffect } from "react";
import type { z } from "zod";

type Dispatch = z.infer<typeof DispatchesSchema>;

const SINCE_MS = 1000 * 60 * 2;

export function useActiveDispatch(
  callback: (dispatch: Dispatch | null) => void,
) {
  const { data } = useQuery(api.dispatches.getRecentDispatch, {
    since: SINCE_MS,
  });
  useEffect(() => {
    if (data) {
      callback(data.dispatch);
    }
  }, [data, callback]);
}
