"use client";

import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/utils/ui";
import { usePanelGroupContext } from "react-resizable-panels";

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className,
    )}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

// Handle offset allows for the handle to be offset from the edge of the panel based on the direction of the panel group
const ResizableHandle = ({
  withHandle,
  className,
  offset = 0,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
  offset?: number;
}) => {
  const context = usePanelGroupContext();
  const isVertical = context?.direction === "vertical";

  return (
    <ResizablePrimitive.PanelResizeHandle
      className={cn(
        "focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        className,
      )}
      style={{
        ...(isVertical
          ? {
              // Vertical layout: move handle from top
              top: offset !== 0 ? `${offset}px` : undefined,
            }
          : {
              // Horizontal layout: move handle from left
              left: offset !== 0 ? `${offset}px` : undefined,
            }),
      }}
      {...props}
    >
      {withHandle && (
        <div
          className={cn(
            "bg-secondary z-10 flex h-4 w-3 items-center justify-center rounded-sm border",
          )}
        >
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
};

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
