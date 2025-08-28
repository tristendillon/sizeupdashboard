import { ViewTokenProvider } from "@/providers/view-providers";
import { ResponsiveLayout } from "@/components/responsive-layout";
import { Header } from "@/components/ui/header";
import { ActiveDispatchProvider } from "@/providers/active-dispatch-provider";
import { DispatchesProvider } from "@/providers/dispatches-provider";
import { WeatherProvider } from "@/providers/weather-provider";
import { getTokenIdFromParams } from "@/utils/server-only";

interface ViewTokenPageProps {
  params: Promise<{
    viewToken: string[];
  }>;
}

export default async function ViewTokenPage({ params }: ViewTokenPageProps) {
  const { data: tokenId, error } = await getTokenIdFromParams(params);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <ViewTokenProvider tokenId={tokenId}>
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
    </ViewTokenProvider>
  );
}
