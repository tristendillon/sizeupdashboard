"use client";

import { api } from "@sizeupdashboard/convex/api/_generated/api";
import type { DispatchesSchema } from "@sizeupdashboard/convex/api/schema";
import { createContext, useCallback, useContext } from "react";
import type { z } from "zod";
import { usePaginatedQuery } from "convex-helpers/react/cache/hooks";
import type { PaginationStatus } from "convex/react";
import type { LatLng } from "@/lib/types";

type Dispatch = z.infer<typeof DispatchesSchema>;

type DistpatchDataMeta = {
  roughDispatchLocations: {
    type: string;
    location: LatLng;
  }[];
  status: PaginationStatus;
};

interface DispatchesContextType {
  dispatches: Dispatch[];
  status: PaginationStatus;
  loadMore: (numItems?: number) => void;
  dispatchMeta: DistpatchDataMeta;
}

const dispatchesContext = createContext<DispatchesContextType | null>(null);

interface DispatchesProviderProps {
  children: React.ReactNode;
}

export const DEFAULT_NUM_DISPATCHES = 10;
export const DEFAULT_NUM_DISPATCH_LOCATIONS = 100;

export function DispatchesProvider({ children }: DispatchesProviderProps) {
  const { results, loadMore, status } = usePaginatedQuery(
    api.dispatches.getDispatches,
    {},
    {
      initialNumItems: DEFAULT_NUM_DISPATCHES,
    },
  );
  const {
    results: dispatchLocations,
    status: dispatchLocationsStatus,
    loadMore: loadMoreDispatchLocations,
  } = usePaginatedQuery(
    api.dispatches.getDispatchLocations,
    {},
    {
      initialNumItems: DEFAULT_NUM_DISPATCH_LOCATIONS,
    },
  );

  // We load more dispatch locations if we're have loaded more plain dispatches than the locations. The locations are
  // important because it will allow us to show a general location for ALL dispatches. Where we can make a "heatmap" of
  // the dispatches.
  const handleLoadMoreDispatches = useCallback(
    (numItems = DEFAULT_NUM_DISPATCHES) => {
      if (results.length + numItems > dispatchLocations.length) {
        loadMoreDispatchLocations(DEFAULT_NUM_DISPATCH_LOCATIONS);
      } else {
        loadMore(numItems);
      }
    },
    [
      loadMore,
      results.length,
      dispatchLocations.length,
      loadMoreDispatchLocations,
    ],
  );

  return (
    <dispatchesContext.Provider
      value={{
        dispatches: results,
        status,
        loadMore: handleLoadMoreDispatches,
        dispatchMeta: {
          roughDispatchLocations: dispatchLocations,
          status: dispatchLocationsStatus,
        },
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
