import { Header } from "@/components/ui/header";
import { ViewMap } from "@/components/view/view-map";
import { ViewSidebar } from "@/components/view/view-sidebar";
import { DispatchesProvider } from "@/providers/dispatches-provider";
import { ViewTokenProvider } from "@/providers/view-providers";
import { WeatherProvider } from "@/providers/weather-provider";
import { z } from "zod";

import { preloadQuery } from "convex/nextjs";
import { api } from "@sizeupdashboard/convex/api/_generated/api";
import { ActiveDispatchProvider } from "@/providers/active-dispatch-provider";

interface ViewTokenPageProps {
  params: Promise<{
    viewToken: string;
  }>;
}

const viewTokenSchema = z.object({
  viewToken: z.string().uuid(),
});

export default async function ViewTokenPage({ params }: ViewTokenPageProps) {
  const { data, error } = viewTokenSchema.safeParse(await params);

  if (error) {
    return <div>Invalid view token</div>;
  }
  const token = await preloadQuery(api.viewToken.getViewToken, {
    token: data.viewToken,
  });

  return (
    <ViewTokenProvider preloadedToken={token}>
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
    </ViewTokenProvider>
  );
}
