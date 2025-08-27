"use client";

import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { env } from "@/env";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <ConvexQueryCacheProvider>{children}</ConvexQueryCacheProvider>
    </ConvexProvider>
  );
}
