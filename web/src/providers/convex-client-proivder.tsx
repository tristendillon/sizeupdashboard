"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { env } from "@/env";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

interface ConvexClientProviderProps {
  children: React.ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
