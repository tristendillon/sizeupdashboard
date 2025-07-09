import { Header } from "@/components/ui/header";
import { ViewMap } from "@/components/view/view-map";
import { ViewSidebar } from "@/components/view/view-sidebar";
import { AlertPopoverProvider } from "@/providers/alert-popover-provider";
import { DispatchesProvider } from "@/providers/dispatches-provider";
import { WeatherProvider } from "@/providers/weather-provider";
import { z } from "zod";

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

  return (
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
}
