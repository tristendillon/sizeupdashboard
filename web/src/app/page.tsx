import { cookies } from "next/headers";

import { Header } from "@/components/ui/header";
import { ViewMap } from "@/components/view/view-map";
import { ViewSidebar } from "@/components/view/view-sidebar";
import { AlertPopoverProvider } from "@/providers/alert-popover-provider";
import { DispatchesProvider } from "@/providers/dispatches-provider";
import {
  AuthedViewTokenProvider,
  PublicViewTokenProvider,
} from "@/providers/view-providers";
import { WeatherProvider } from "@/providers/weather-provider";

export default async function PublicHomePage() {
  const cookieStore = await cookies();
  cookieStore.getAll().forEach((c) => console.log(c));
  const convexSessionId = cookieStore.get("session-id")?.value;
  const refreshToken = cookieStore.get("refresh-token")?.value;
  const children = (
    <WeatherProvider>
      <DispatchesProvider>
        <AlertPopoverProvider>
          <div className="flex h-screen w-screen flex-col overflow-hidden">
            <Header />
            <div className="flex h-full w-full flex-1 flex-col-reverse overflow-hidden md:flex-row">
              <ViewSidebar />
              <ViewMap />
            </div>
          </div>
        </AlertPopoverProvider>
      </DispatchesProvider>
    </WeatherProvider>
  );
  if (refreshToken) {
    return (
      <AuthedViewTokenProvider
        convexSessionId={convexSessionId}
        refreshToken={refreshToken}
      >
        {children}
      </AuthedViewTokenProvider>
    );
  }
  return (
    <PublicViewTokenProvider convexSessionId={convexSessionId}>
      {children}
    </PublicViewTokenProvider>
  );
}
