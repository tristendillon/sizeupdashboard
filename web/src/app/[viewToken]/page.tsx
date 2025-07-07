import { AlertPopover } from "@/components/alert-popover";
import { Header } from "@/components/ui/header";
import { AlertPopoverProvider } from "@/providers/alert-popover-provider";
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
      <AlertPopoverProvider>
        <main className="h-screen w-screen overflow-hidden">
          <Header />
          <AlertPopover />
        </main>
      </AlertPopoverProvider>
    </WeatherProvider>
  );
}
