"use client";

import { useActiveDispatch } from "@/providers/active-dispatch-provider";
import { Button } from "./button";

export function DismissButton() {
  const { dismissDispatch, dispatch } = useActiveDispatch();
  if (!dispatch) {
    return null;
  }
  return (
    <div className="flex w-full items-center justify-end pr-4">
      <Button onClick={dismissDispatch}>Dismiss</Button>
    </div>
  );
}
