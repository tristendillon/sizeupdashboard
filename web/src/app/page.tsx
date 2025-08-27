import { PublicViewTokenProvider } from "@/providers/view-providers";
import { HomeDashboard } from "@/components/home-dashboard";

export default async function PublicHomePage() {
  return (
    <PublicViewTokenProvider>
      <HomeDashboard />
    </PublicViewTokenProvider>
  );
}
