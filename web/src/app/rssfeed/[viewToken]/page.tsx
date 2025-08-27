import { ViewTokenProvider } from "@/providers/view-providers";
import { z } from "zod";

import { preloadQuery } from "convex/nextjs";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { RSSFeedView } from "@/components/rss-feed-view";

interface RSSFeedViewTokenPageProps {
  params: Promise<{
    viewToken: string;
  }>;
}

const viewTokenSchema = z.object({
  viewToken: z.string().uuid(),
});

export default async function RSSFeedViewTokenPage({ params }: RSSFeedViewTokenPageProps) {
  const { data, error } = viewTokenSchema.safeParse(await params);

  if (error) {
    return <div>Invalid view token</div>;
  }
  const token = await preloadQuery(api.viewToken.getViewToken, {
    token: data.viewToken,
  });

  return (
    <ViewTokenProvider preloadedToken={token}>
      <RSSFeedView />
    </ViewTokenProvider>
  );
}