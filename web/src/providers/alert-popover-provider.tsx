"use client";

import { useQuery } from "@/hooks/use-query";
import { api } from "@sizeupdashboard/convex/api/_generated/api";
import type { DispatchesSchema } from "@sizeupdashboard/convex/api/schema";
import { createContext, useCallback, useContext, useState } from "react";
import type { z } from "zod";

type Dispatch = z.infer<typeof DispatchesSchema>;

type AlertPopoverContextType = {
  dispatch: Dispatch | null;
  dismissDispatch: () => void;
  activateDispatch: (dispatch: Dispatch) => void;
};

export const AlertPopoverContext =
  createContext<AlertPopoverContextType | null>(null);

interface AlertPopoverProviderProps {
  children: React.ReactNode;
}
const SINCE_MS = 1000 * 60 * 2;
export function AlertPopoverProvider({ children }: AlertPopoverProviderProps) {
  const [activeDispatch, setActiveDispatch] = useState<Dispatch | null>(null);
  const { data } = useQuery(api.dispatches.getRecentDispatch, {
    since: SINCE_MS,
  });

  const dismissDispatch = useCallback(() => {
    setActiveDispatch(null);
  }, [setActiveDispatch]);

  const activateDispatch = useCallback(
    (dispatch: Dispatch) => {
      setActiveDispatch(dispatch);
    },
    [setActiveDispatch],
  );

  const dispatch = data?.dispatch ?? activeDispatch;

  return (
    <AlertPopoverContext.Provider
      value={{ dispatch, dismissDispatch, activateDispatch }}
    >
      {children}
    </AlertPopoverContext.Provider>
  );
}

export function useAlertPopover() {
  const context = useContext(AlertPopoverContext);
  if (!context) {
    throw new Error(
      "useAlertPopover must be used within an AlertPopoverProvider",
    );
  }
  return context;
}
