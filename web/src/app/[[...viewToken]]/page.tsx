import { ViewTokenProvider } from "@/providers/view-providers";
import { z } from "zod";

import { fetchQuery } from "convex/nextjs";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { ResponsiveLayout } from "@/components/responsive-layout";
import { Header } from "@/components/ui/header";
import { ActiveDispatchProvider } from "@/providers/active-dispatch-provider";
import { DispatchesProvider } from "@/providers/dispatches-provider";
import { WeatherProvider } from "@/providers/weather-provider";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";

interface ViewTokenPageProps {
  params: Promise<{
    viewToken: string;
  }>;
}

const viewTokenSchema = z.object({
  viewToken: z.string().uuid().optional(),
});

export default async function ViewTokenPage({ params }: ViewTokenPageProps) {
  const { viewToken } = await params;

  const { error } = viewTokenSchema.safeParse(viewToken);

  if (error && viewToken) {
    return <div>Invalid view token</div>;
  }

  let tokenId: Id<"viewTokens"> | undefined;
  if (viewToken) {
    const viewTokenData = await fetchQuery(api.viewToken.getViewToken, {
      token: viewToken,
    });
    tokenId = viewTokenData?._id as Id<"viewTokens">;
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
