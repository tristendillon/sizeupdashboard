import { ViewTokenProvider } from "@/providers/view-providers";
import { z } from "zod";
import { fetchQuery } from "convex/nextjs";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import { DispatchesProvider } from "@/providers/dispatches-provider";
import { DispatchList } from "@/components/dispatch-list";

interface RSSFeedViewTokenPageProps {
  params: Promise<{
    viewToken: string;
  }>;
}

const viewTokenSchema = z.object({
  viewToken: z.string().uuid(),
});

export default async function RSSFeedViewTokenPage({
  params,
}: RSSFeedViewTokenPageProps) {
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
    </ViewTokenProvider>
  );
}
