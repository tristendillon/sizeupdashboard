"use client";

import { api } from "@sizeupdashboard/convex/api/_generated/api";
import type { DispatchesSchema } from "@sizeupdashboard/convex/api/schema";
import { createContext, useCallback, useContext } from "react";
import type { z } from "zod";
import { usePaginatedQuery } from "convex-helpers/react/cache/hooks";
import type { PaginationStatus } from "convex/react";
import type { LatLng } from "@/lib/types";
import { getLatLngDistances } from "@/utils/lat-lng";
import { useViewToken } from "./view-token-provider";

type Dispatch = z.infer<typeof DispatchesSchema>;

interface DispatchesContextType {
  dispatches: Dispatch[];
  status: PaginationStatus;
  loadMore: (numItems: number) => void;
  getDispatchesInRadius: (location: LatLng, distnace: number) => Dispatch[];
}

const dispatchesContext = createContext<DispatchesContextType | null>(null);

interface DispatchesProviderProps {
  children: React.ReactNode;
}

export const DEFAULT_NUM_DISPATCHES = 10;
export const DEFAULT_NUM_DISPATCH_LOCATIONS = 100;

export function DispatchesProvider({ children }: DispatchesProviderProps) {
  const { tokenId } = useViewToken();
  const { results, loadMore, status } = usePaginatedQuery(
    api.dispatches.getDispatches,
    {
      viewToken: tokenId,
    },
    {
      initialNumItems: DEFAULT_NUM_DISPATCHES,
    },
  );

  const loadMoreDispatches = useCallback(
    (numItems: number) => {
      loadMore(numItems);
    },
    [loadMore],
  );

  const getDispatchesInRadius = useCallback(
    (location: LatLng, distnace: number) => {
      return results.filter((l) => {
        const dL = {
          lat: l.latitude,
          lng: l.longitude,
        };
        const distance = getLatLngDistances(location, dL);
        return distance < distnace;
      });
    },
    [results],
  );

  return (
    <dispatchesContext.Provider
      value={{
        dispatches: results,
        status,
        loadMore: loadMoreDispatches,
        getDispatchesInRadius,
      }}
    >
      {children}
    </dispatchesContext.Provider>
  );
}

export const useDispatches = () => {
  const context = useContext(dispatchesContext);
  if (!context) {
    throw new Error("useDispatches must be used within a DispatchesProvider");
  }
  return context;
};
