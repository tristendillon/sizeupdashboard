"use client";

import { createContext, useContext } from "react";
import type { Id } from "@sizeupdashboard/convex/api/_generated/dataModel";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import Link from "next/link";
import type { api } from "@sizeupdashboard/convex/api/_generated/api";

type ViewToken = {
  tokenId?: Id<"viewTokens">;
  convexSessionId?: string;
};

export const ViewTokenContext = createContext<ViewToken | null>(null);

interface PublicViewTokenProviderProps {
  children: React.ReactNode;
  convexSessionId?: string;
}

export const PublicViewTokenProvider = ({
  children,
}: PublicViewTokenProviderProps) => {
  return (
    <ViewTokenContext.Provider
      value={{ tokenId: undefined, convexSessionId: undefined }}
    >
      {children}
    </ViewTokenContext.Provider>
  );
};

interface ViewTokenProviderProps {
  children: React.ReactNode;
  preloadedToken: Preloaded<typeof api.viewToken.getViewToken>;
}

export const ViewTokenProvider = ({
  children,
  preloadedToken,
}: ViewTokenProviderProps) => {
  const viewToken = usePreloadedQuery(preloadedToken);

  if (!viewToken) {
    return (
      <div>
        View token is invalid
        <Link href="/">Go to home</Link>
      </div>
    );
  }

  return (
    <ViewTokenContext.Provider
      value={{
        tokenId: viewToken._id as Id<"viewTokens">,
      }}
    >
      {children}
    </ViewTokenContext.Provider>
  );
};

export function useViewToken() {
  const context = useContext(ViewTokenContext);
  if (!context) {
    throw new Error("useViewToken must be used within a ViewTokenProvider");
  }
  return context;
}
