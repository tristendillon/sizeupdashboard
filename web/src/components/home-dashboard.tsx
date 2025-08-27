import { ActiveDispatchProvider } from '@/providers/active-dispatch-provider';
import { DispatchesProvider } from '@/providers/dispatches-provider';
import { WeatherProvider } from '@/providers/weather-provider';
import { Header } from './ui/header';
import { ViewMap } from './view-map';
import { ViewSidebar } from './view-sidebar';

export function HomeDashboard() {
  return (
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
  );
}
