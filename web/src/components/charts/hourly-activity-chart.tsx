"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface HourlyActivityChartProps {
  data: {
    hour: number;
    count: number;
  }[];
  title?: string;
  description?: string;
}

const chartConfig = {
  dispatches: {
    label: "Dispatches",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function HourlyActivityChart({
  data,
  title = "24-Hour Activity",
  description = "Dispatch volume by hour of day",
}: HourlyActivityChartProps) {
  // Transform data to match the new chart component format
  const chartData = data.map((item) => ({
    hour: item.hour,
    dispatches: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(hour) => `${hour.toString().padStart(2, "0")}:00`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="dispatches"
                  labelFormatter={(value: string, payload) => {
                    const data = payload[0]?.payload;
                    if (!data) return value;
                    const hour = data?.hour;
                    const timeRange = `${hour.toString().padStart(2, "0")}:00 - ${((hour + 1) % 24).toString().padStart(2, "0")}:00`;
                    return timeRange;
                  }}
                />
              }
            />
            <Bar
              dataKey="dispatches"
              fill="var(--color-dispatches)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
