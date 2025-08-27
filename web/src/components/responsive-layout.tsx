"use client";

import { useEffect, useState } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./ui/resizable";
import { ViewMap } from "./view-map";
import { ViewSidebar } from "./view-sidebar";

export function ResponsiveLayout() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return (
    <ResizablePanelGroup
      direction={isMobile ? "vertical" : "horizontal"}
      className="flex-1"
    >
      {isMobile ? (
        <>
          <ResizablePanel defaultSize={60} minSize={40} maxSize={80}>
            <ViewMap />
          </ResizablePanel>

          <ResizableHandle className="z-50" withHandle offset={5} />

          <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
            <ViewSidebar />
          </ResizablePanel>
        </>
      ) : (
        <>
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <ViewSidebar />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={70} minSize={50}>
            <ViewMap />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
