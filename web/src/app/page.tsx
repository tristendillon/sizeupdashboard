import { cookies } from "next/headers";

import { Header } from "@/components/ui/header";
import { ViewMap } from "@/components/view/view-map";
import { ViewSidebar } from "@/components/view/view-sidebar";
import { AlertPopoverProvider } from "@/providers/alert-popover-provider";
import { DispatchesProvider } from "@/providers/dispatches-provider";
import { PublicViewTokenProvider } from "@/providers/view-providers";
import { WeatherProvider } from "@/providers/weather-provider";

export default async function PublicHomePage() {
  return (
    <PublicViewTokenProvider>
      <WeatherProvider>
        <DispatchesProvider>
          <AlertPopoverProvider>
            <div className="flex h-screen w-screen flex-col overflow-hidden">
              <Header />
              <div className="flex h-full w-full flex-1 flex-col-reverse overflow-hidden md:flex-row">
                <ViewSidebar />
                <ViewMap />
              </div>
            </div>
          </AlertPopoverProvider>
        </DispatchesProvider>
      </WeatherProvider>
    </PublicViewTokenProvider>
  );
}
