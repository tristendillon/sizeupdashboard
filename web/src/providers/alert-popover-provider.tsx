"use client";

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

const testResponse = {
  dispatch: {
    _creationTime: 1751895797060.0977,
    _id: "j97e6177w69g9kb9kwenkh328s7k8r49",
    address: "811 EL PASO LN",
    address2: "1",
    city: "MANHATTAN",
    dispatchCreatedAt: 1751895736000,
    dispatchId: 38223866,
    incidentTypeCode: "MED-SICK PERSON",
    latitude: 39.174587,
    longitude: -96.569248,
    message: null,
    narrative: `2025-07-07 08:44:10: - No priority symptoms (ALPHA conditions 2-12 not identified).
2025-07-07 08:44:04: Dispatch Code: 26C01 (ALTERED LEVEL OF CONSCIOUSNESS)
Unit Response: Charlie
 - He is lethargic.
 - He is breathing normally.
 - He is not bleeding (or vomiting blood).
 - He does not have any pain.
Comment: ONGOING SINCE FRIDAY. REFUSING TO EAT EXCEPT ONCE A DAY
2025-07-07 08:42:53: Chief Complaint: Sick Person (Specific Diagnosis)
97-year-old, Male, Conscious, Breathing.
Caller Statement: FATHER IS LETHARGIC

Contact: VERIZON WIRELESS
Phone: (785)477-1011
TIME:
CODE:
DATE:
INCIDENT: , 250001650
ZONE:`,
    stateCode: "KS",
    statusCode: "open",
    type: "MED-SICK PERSON",
    unitCodes: ["MED21", "Q2"],
    xrefId: "1820274",
  },
};

export function AlertPopoverProvider({ children }: AlertPopoverProviderProps) {
  const [dispatch, setDispatch] = useState<Dispatch | null>(
    testResponse.dispatch,
  );

  // useActiveDispatch((dispatch) => {
  //   setDispatch(dispatch);
  // });

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
