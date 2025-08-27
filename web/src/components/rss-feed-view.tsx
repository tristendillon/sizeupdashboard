"use client";

import { DispatchesProvider } from "@/providers/dispatches-provider";
import { WeatherProvider } from "@/providers/weather-provider";
import { DispatchList } from "@/components/dispatch-list";

export function RSSFeedView() {
  return (
    <WeatherProvider>
      <DispatchesProvider>
        <div className="flex h-screen w-screen flex-col overflow-hidden">
          {/* <Header /> */}
          <main className="flex-1 overflow-hidden">
            <div className="container mx-auto h-full">
              <DispatchList className="h-full overflow-y-auto" />
            </div>
          </main>
        </div>
      </DispatchesProvider>
    </WeatherProvider>
  );
}
