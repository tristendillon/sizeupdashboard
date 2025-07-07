import { useAlertPopover } from "@/providers/alert-popover-provider";
import React from "react";
import { Separator } from "../ui/separator";

export default function AlertPopoverSidebar() {
  const { dispatch } = useAlertPopover();
  if (!dispatch) {
    return null;
  }
  return (
    <section className="bg-secondary flex h-full max-h-[60vh] w-full flex-col gap-4 p-4 md:max-h-[100vh] md:max-w-[40%]">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tighter text-red-500 uppercase md:text-6xl">
          {dispatch.type}
        </h2>
        <h3 className="text-xl font-semibold md:text-3xl">
          {dispatch.address}
        </h3>
      </div>
      <Separator />
      <div className="space-y-2">
        <h2 className="text-muted-foreground text-lg md:text-xl">
          Units Assigned:
        </h2>
        <div className="flex w-full gap-2">
          {dispatch.unitCodes.map((unitCode, index) => (
            <div
              key={index}
              className="bg-primary/10 text-primary flex w-full items-center rounded-md px-3 py-2"
            >
              {/* TODO: Add based off units at the station for the share token. This is a temporary solution. */}
              {!dispatch.unitCodes.includes(unitCode) ? (
                <span className="mr-2 h-3 w-3 rounded-full bg-green-500"></span>
              ) : (
                <span className="mr-2 h-3 w-3 rounded-full bg-gray-300"></span>
              )}
              <span className="text-base font-medium">{unitCode}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
