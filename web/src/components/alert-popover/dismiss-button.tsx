"use client";

import { useAlertPopover } from "@/providers/alert-popover-provider";
import { Button } from "../ui/button";

export function DismissButton() {
  const { dismissDispatch, dispatch } = useAlertPopover();
  if (!dispatch) {
    return null;
  }
  return (
    <div className="flex w-full items-center justify-end pr-4">
      <Button onClick={dismissDispatch}>Dismiss</Button>
    </div>
  );
}
