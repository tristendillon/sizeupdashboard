"use client";

import { Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface DispatchPieChartProps {
  data: Record<string, number>;
  title?: string;
  description?: string;
  total: number;
}

const chartConfig = {
  count: {
    label: "Dispatches",
  },
  fire: {
    label: "Fire",
    color: "var(--chart-1)",
  },
  medical: {
    label: "Medical",
    color: "var(--chart-2)",
  },
  mva: {
    label: "MVA",
    color: "var(--chart-3)",
  },
  rescue: {
    label: "Rescue",
    color: "var(--chart-4)",
  },
  law: {
    label: "Law",
    color: "var(--chart-5)",
  },
  other: {
    label: "Other",
    color: "var(--chart-6)",
  },
  aircraft: {
    label: "Aircraft",
    color: "var(--chart-7)",
  },
  hazmat: {
    label: "Hazmat",
    color: "var(--chart-8)",
  },
  marine: {
    label: "Marine",
    color: "var(--chart-9)",
  },
} satisfies ChartConfig;

export function DispatchPieChart({
  data,
  total,
  title = "Dispatch Distribution",
  description = "Breakdown by emergency type",
}: DispatchPieChartProps) {
  // Transform data to include colors using chart config
  const chartData = Object.entries(data)
    .filter(([_, count]) => count > 0)
    .map(([group, count]) => ({
      group,
      count,
      fill: `var(--color-${group})`,
      percentage: ((count / total) * 100).toFixed(2),
    }));

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="count" label nameKey="group" />
            <ChartLegend
              content={<ChartLegendContent nameKey="group" />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Showing {total} dispatches
        </div>
      </CardFooter>
    </Card>
  );
}
