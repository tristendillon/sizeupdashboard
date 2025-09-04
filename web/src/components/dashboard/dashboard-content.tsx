"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DispatchCard } from "@/components/dispatch-list";
import { DispatchPieChart } from "@/components/charts/dispatch-pie-chart";
import { HourlyActivityChart } from "@/components/charts/hourly-activity-chart";
import { useDispatchAnalytics } from "@/hooks/use-dispatch-analytics";
import { Activity, Eye, Loader2 } from "lucide-react";
import { timeStampFormatter } from "@/utils/timestamp";

// Mock data for view tokens
const mockViewTokens = [
  { name: "Fire Station 1", lastPing: Date.now() - 1000 * 30, isActive: true },
  { name: "Fire Station 2", lastPing: Date.now() - 1000 * 45, isActive: true },
  { name: "Police Station", lastPing: Date.now() - 1000 * 120, isActive: true },
  { name: "EMS Station", lastPing: Date.now() - 1000 * 60, isActive: true },
  { name: "Emergency Ops", lastPing: Date.now() - 1000 * 90, isActive: true },
  { name: "City Hall", lastPing: Date.now() - 1000 * 600, isActive: false },
  {
    name: "Training Center",
    lastPing: Date.now() - 1000 * 300,
    isActive: false,
  },
  { name: "Mobile Unit 1", lastPing: Date.now() - 1000 * 20, isActive: true },
];

export function DashboardContent() {
  const {
    counts,
    dispatches,
    loading,
    totalDispatches,
    todaysDispatches,
    hours,
  } = useDispatchAnalytics();

  const relativeFormatter = timeStampFormatter("relative");

  const activeViewTokens = mockViewTokens.filter(
    (token) => token.isActive,
  ).length;
  const totalViewTokens = mockViewTokens.length;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="flex gap-4">
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Dispatches
            </CardTitle>
            <Activity className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDispatches}</div>
            <p className="text-muted-foreground text-xs">
              +{todaysDispatches} today
            </p>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active View Tokens
            </CardTitle>
            <Eye className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeViewTokens}</div>
            <p className="text-muted-foreground text-xs">
              of {totalViewTokens} total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Dispatches using DispatchList */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Dispatches</CardTitle>
            <CardDescription>Latest emergency responses</CardDescription>
          </CardHeader>
          <CardContent className="max-h-80 gap-4 space-y-2 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="size-4 animate-spin" />
              </div>
            ) : (
              <>
                {dispatches?.map((dispatch) => (
                  <DispatchCard key={dispatch.dispatchId} dispatch={dispatch} />
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* View Tokens Status */}
        <Card>
          <CardHeader>
            <CardTitle>View Token Status</CardTitle>
            <CardDescription>Connected viewing locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockViewTokens.map((token, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`size-2 rounded-full ${token.isActive ? "bg-green-500" : "bg-gray-300"}`}
                    />
                    <span className="text-sm font-medium">{token.name}</span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {relativeFormatter(token.lastPing)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DispatchPieChart data={counts ?? {}} total={totalDispatches ?? 1} />
        <HourlyActivityChart data={hours ?? []} />
      </div>
    </div>
  );
}
