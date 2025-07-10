"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatches } from "./dispatches-provider";
import type { DispatchWithType } from "@sizeupdashboard/convex/api/schema";

type AlertPopoverContextType = {
  dispatch: DispatchWithType | null;
  timeLeft: number;
  dismissDispatch: () => void;
  activateDispatch: (dispatch: DispatchWithType) => void;
};

export const AlertPopoverContext =
  createContext<AlertPopoverContextType | null>(null);

interface AlertPopoverProviderProps {
  children: React.ReactNode;
}

export const DISPLAY_DURATION_MS = 1000 * 60 * 2; // 2 minutes
const TIMER_INTERVAL_MS = 100; // Update every 100ms

export function AlertPopoverProvider({ children }: AlertPopoverProviderProps) {
  const { dispatches } = useDispatches();
  const [activeDispatch, setActiveDispatch] = useState<DispatchWithType | null>(
    null,
  );
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dismissedDispatchIdsRef = useRef<Set<number>>(new Set());

  const clearAllTimers = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const dismissDispatch = useCallback(() => {
    // Add current dispatch to dismissed set
    if (activeDispatch) {
      dismissedDispatchIdsRef.current.add(activeDispatch.dispatchId);
    }

    setActiveDispatch(null);
    setTimeLeft(0);
    clearAllTimers();
  }, [activeDispatch, clearAllTimers]);

  const activateDispatch = useCallback(
    (dispatch: DispatchWithType, autoActivated = false) => {
      // Clear any existing timers
      clearAllTimers();

      // Remove from dismissed set if manually activating
      if (!autoActivated) {
        dismissedDispatchIdsRef.current.delete(dispatch.dispatchId);
      }

      setActiveDispatch(dispatch);

      // Calculate time left based on dispatch creation time
      const elapsed = Date.now() - dispatch._creationTime;
      console.log("elapsed", elapsed);
      const remainingTime = Math.max(0, DISPLAY_DURATION_MS - elapsed);

      setTimeLeft(remainingTime);

      // Set up auto-close timer only for auto-activated dispatches
      if (autoActivated && remainingTime > 0) {
        autoCloseTimerRef.current = setTimeout(() => {
          dismissDispatch();
        }, remainingTime);
      }

      // Set up countdown timer
      if (remainingTime > 0) {
        countdownTimerRef.current = setInterval(() => {
          setTimeLeft((prevTimeLeft) => {
            const newTimeLeft = Math.max(0, prevTimeLeft - TIMER_INTERVAL_MS);

            // Auto-dismiss when time runs out (only for auto-activated)
            if (newTimeLeft === 0 && autoActivated) {
              // Use setTimeout to avoid state update during render
              setTimeout(() => {
                dismissDispatch();
              }, 0);
            }

            return newTimeLeft;
          });
        }, TIMER_INTERVAL_MS);
      }
    },
    [clearAllTimers, dismissDispatch],
  );

  // useEffect(() => {
  //   const initialDispatch: Dispatch = {
  //     dispatchId: 12345,
  //     narrative: "Test emergency dispatch for timer testing",
  //     type: "EMERGENCY",
  //     message: "Structure fire reported at residential address",
  //     address: "123 Main Street",
  //     address2: "Apt 2B",
  //     city: "Wichita",
  //     stateCode: "KS",
  //     latitude: 37.6872,
  //     longitude: -97.3301,
  //     unitCodes: ["ENG1", "TRUCK1", "MEDIC1"],
  //     incidentTypeCode: "FIRE",
  //     statusCode: "ACTIVE",
  //     xrefId: "XR-001",
  //     dispatchType: undefined,
  //     dispatchCreatedAt: Date.now() - 5000, // 5 seconds ago
  //   };

  //   activateDispatch(initialDispatch);
  // }, []);

  // Check for new dispatches and auto-activate if within time frame
  useEffect(() => {
    const latestDispatch = dispatches[0];

    if (!latestDispatch) return;

    console.log("latestDispatch", latestDispatch);
    const timeSinceDispatch = Date.now() - latestDispatch._creationTime;
    console.log("timeSinceDispatch", timeSinceDispatch);
    const isWithinTimeFrame = timeSinceDispatch <= DISPLAY_DURATION_MS;
    const hasBeenDismissed = dismissedDispatchIdsRef.current.has(
      latestDispatch.dispatchId,
    );
    const isAlreadyActive =
      activeDispatch?.dispatchId === latestDispatch.dispatchId;

    // Only auto-activate if:
    // 1. Dispatch is within time frame
    // 2. Has not been manually dismissed
    // 3. Is not already the active dispatch
    if (isWithinTimeFrame && !hasBeenDismissed && !isAlreadyActive) {
      activateDispatch(latestDispatch, true);
    }
  }, [dispatches, activateDispatch, activeDispatch?.dispatchId]); // Removed activeDispatch from deps

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return (
    <AlertPopoverContext.Provider
      value={{
        dispatch: activeDispatch,
        timeLeft,
        dismissDispatch,
        activateDispatch: (dispatch) => activateDispatch(dispatch, false),
      }}
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
