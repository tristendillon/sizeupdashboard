"use client";

import { useActiveDispatch } from "@/hooks/use-active-dispatch";
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

export function AlertPopoverProvider({ children }: AlertPopoverProviderProps) {
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);

  useActiveDispatch((dispatch) => {
    setDispatch(dispatch);
  });

  const dismissDispatch = useCallback(() => {
    setDispatch(null);
  }, [setDispatch]);

  const activateDispatch = useCallback(
    (dispatch: Dispatch) => {
      setDispatch(dispatch);
    },
    [setDispatch],
  );

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
