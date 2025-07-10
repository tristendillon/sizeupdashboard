"use client";

import { Separator } from "@/components/ui/separator";
import {
  DEFAULT_NUM_DISPATCHES,
  useDispatches,
} from "@/providers/dispatches-provider";
import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "../ui/skeleton";
import { relativeTs } from "@/utils/timestamp";
import { useAlertPopover } from "@/providers/alert-popover-provider";
import type { DispatchWithType } from "@sizeupdashboard/convex/api/schema";

export function ViewSidebar() {
  const { dispatch } = useAlertPopover();
  return (
    <section className="bg-secondary overflow-y-none relative flex h-full max-h-[60vh] w-full flex-col md:max-h-[100vh] md:max-w-[30%]">
      {dispatch && <AlertPopoverSidebarContent dispatch={dispatch} />}
      <NormalSidebarContent />
    </section>
  );
}

interface AlertPopoverSidebarProps {
  dispatch: DispatchWithType;
}

function AlertPopoverSidebarContent({ dispatch }: AlertPopoverSidebarProps) {
  return (
    <div className="bg-secondary absolute inset-0 z-50 space-y-4 p-4">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tighter text-red-500 uppercase md:text-6xl">
          {dispatch.type}
        </h2>
        <h3 className="text-xl font-semibold md:text-3xl">
          {dispatch.address}
        </h3>
      </div>
      <Separator />
      <div className="space-y-2">
        <h2 className="text-muted-foreground text-lg md:text-xl">
          Units Assigned:
        </h2>
        <div className="flex w-full gap-2">
          {dispatch.unitCodes.map((unitCode, index) => (
            <div
              key={index}
              className="bg-primary/10 text-primary flex w-full items-center rounded-md px-3 py-2"
            >
              {/* TODO: Add based off units at the station for the share token. This is a temporary solution. */}
              {!dispatch.unitCodes.includes(unitCode) ? (
                <span className="mr-2 h-3 w-3 rounded-full bg-green-500"></span>
              ) : (
                <span className="mr-2 h-3 w-3 rounded-full bg-gray-300"></span>
              )}
              <span className="text-base font-medium">{unitCode}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NormalSidebarContent() {
  const { activateDispatch } = useAlertPopover();
  const { dispatches, loadMore, status } = useDispatches();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [loadCount, setLoadCount] = useState(0);

  useEffect(() => {
    if (status !== "CanLoadMore") return;
    const loadMoreRefCurrent = loadMoreRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          // Calculate exponential loading size
          const base = DEFAULT_NUM_DISPATCHES;
          const multiplier = loadCount >= 10 ? 4 : loadCount >= 5 ? 2 : 1;
          const nextLoad = base * multiplier;

          loadMore(nextLoad);
          setLoadCount((count) => count + 1);
        }
      },
      { rootMargin: "200px" },
    );

    if (loadMoreRefCurrent) {
      observer.observe(loadMoreRefCurrent);
    }

    return () => {
      if (loadMoreRefCurrent) {
        observer.unobserve(loadMoreRefCurrent);
      }
    };
  }, [status, loadMore, loadCount]);

  return (
    <div className="space-y-2 overflow-y-auto p-4">
      {status === "LoadingFirstPage" &&
        Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

      {dispatches.map((dispatch) => (
        <DispatchCard
          key={dispatch.dispatchId}
          dispatch={dispatch}
          activateDispatch={activateDispatch}
        />
      ))}

      {status === "LoadingMore" &&
        Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={`loading-more-${i}`} />
        ))}

      {status === "CanLoadMore" && <div ref={loadMoreRef} className="h-1" />}
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="bg-zinc-900">
      <CardContent className="space-y-2 py-4">
        <Skeleton className="h-4 w-32 bg-zinc-700" />
        <Skeleton className="h-4 w-full bg-zinc-700" />
        <Skeleton className="h-4 w-48 bg-zinc-700" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12 rounded bg-zinc-700" />
          <Skeleton className="h-5 w-12 rounded bg-zinc-700" />
          <Skeleton className="h-5 w-12 rounded bg-zinc-700" />
        </div>
      </CardContent>
    </Card>
  );
}

interface DispatchCardProps {
  dispatch: DispatchWithType;
  activateDispatch: (dispatch: DispatchWithType) => void;
}

function DispatchCard({ dispatch, activateDispatch }: DispatchCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="relative bg-zinc-900 p-0 text-zinc-200">
      <a
        className="pointer-events-auto absolute inset-0 cursor-pointer"
        onClick={() => activateDispatch(dispatch)}
      />
      <CardContent className="pointer-events-none relative z-10 p-3 px-5">
        <div className="mb-1 flex items-center justify-between">
          <div className="font-semibold">{dispatch.type}</div>
          <div className="text-xs text-zinc-400">
            {relativeTs(dispatch.dispatchCreatedAt)}
          </div>
        </div>
        <pre
          className={`mb-1 whitespace-pre-wrap ${expanded ? "" : "line-clamp-3"}`}
        >
          {dispatch.narrative ?? "No details available"}
        </pre>
        <div className="flex items-center justify-between">
          <div>
            {dispatch.narrative && dispatch.narrative.length > 80 && (
              <button
                className="pointer-events-auto z-10 text-xs text-blue-400 hover:underline"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
            <div className="mb-2 text-xs text-zinc-500">
              {dispatch.address ?? "[REDACTED]"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {dispatch.unitCodes
              .filter((unit) => isNaN(Number(unit)))
              .map((unit) => (
                <Badge key={unit} variant="secondary">
                  {unit}
                </Badge>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
