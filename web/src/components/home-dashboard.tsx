import { ActiveDispatchProvider } from '@/providers/active-dispatch-provider';
import { DispatchesProvider } from '@/providers/dispatches-provider';
import { WeatherProvider } from '@/providers/weather-provider';
import { Header } from './ui/header';
import { ResponsiveLayout } from './responsive-layout';

export function HomeDashboard() {
  return (
    <WeatherProvider>
      <DispatchesProvider>
        <ActiveDispatchProvider>
          <div className="flex h-screen w-screen flex-col overflow-hidden">
            <Header />
            <ResponsiveLayout />
          </div>
        </ActiveDispatchProvider>
      </DispatchesProvider>
    </WeatherProvider>
  );
}
