import { Header } from "@/components/ui/header";
import { ViewMap } from "@/components/view/view-map";
import { ViewSidebar } from "@/components/view/view-sidebar";
import { ActiveDispatchProvider } from "@/providers/active-dispatch-provider";
import { DispatchesProvider } from "@/providers/dispatches-provider";
import { PublicViewTokenProvider } from "@/providers/view-providers";
import { WeatherProvider } from "@/providers/weather-provider";

export default async function PublicHomePage() {
  return (
    <PublicViewTokenProvider>
      <WeatherProvider>
        <DispatchesProvider>
          <ActiveDispatchProvider>
            <div className="flex h-screen w-screen flex-col overflow-hidden">
              <Header />
              <div className="flex h-full w-full flex-1 flex-col-reverse overflow-hidden md:flex-row">
                <ViewSidebar />
                <ViewMap />
              </div>
            </div>
          </ActiveDispatchProvider>
        </DispatchesProvider>
      </WeatherProvider>
    </PublicViewTokenProvider>
  );
}
