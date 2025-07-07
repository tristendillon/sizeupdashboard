import { AlertPopover } from "@/components/alert-popover";
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
    <>
      <main className="h-screen w-screen">
        <AlertPopover />
      </main>
    </>
  );
}
