import { PublicViewTokenProvider } from "@/providers/view-providers";
import { RSSFeedView } from "@/components/rss-feed-view";

export default async function RSSFeedPage() {
  return (
    <PublicViewTokenProvider>
      <RSSFeedView />
    </PublicViewTokenProvider>
  );
}