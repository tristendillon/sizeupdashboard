"use client";

import { useQuery } from "@/hooks/use-query";
import { api } from "@sizeupdashboard/convex/api/_generated/api";
import type { DispatchesSchema } from "@sizeupdashboard/convex/api/schema";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { z } from "zod";
import { useViewToken } from "./view-token-provider";

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
  const { tokenId } = useViewToken();
  const { data } = useQuery(api.dispatches.getRecentDispatch, {
    since: SINCE_MS,
    viewToken: tokenId ?? undefined,
  });

  useEffect(() => {
    if (data?.dispatch) {
      setActiveDispatch(data.dispatch);
    }
  }, [data?.dispatch]);

  const dismissDispatch = useCallback(() => {
    setActiveDispatch(null);
  }, [setActiveDispatch]);

  const activateDispatch = useCallback(
    (dispatch: Dispatch) => {
      setActiveDispatch(dispatch);
    },
    [setActiveDispatch],
  );

  return (
    <AlertPopoverContext.Provider
      value={{ dispatch: activeDispatch, dismissDispatch, activateDispatch }}
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
