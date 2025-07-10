"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Id } from "@sizeupdashboard/convex/api/_generated/dataModel";
import { usePreloadedQuery, type Preloaded, useAction } from "convex/react";
import { api } from "@sizeupdashboard/convex/api/_generated/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ViewToken = {
  tokenId?: Id<"viewTokens">;
  convexSessionId?: string;
};

export const ViewTokenContext = createContext<ViewToken | null>(null);

interface AuthedViewTokenProviderProps {
  children: React.ReactNode;
  convexSessionId?: string;
  refreshToken: string;
}

export const AuthedViewTokenProvider = ({
  children,
  convexSessionId,
  refreshToken,
}: AuthedViewTokenProviderProps) => {
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const isAuthenticatedAction = useAction(api.auth.isAuthenticated);
  const refreshSessionAction = useAction(api.auth.refreshSession);
  const router = useRouter();

  useEffect(() => {
    const refreshSession = async () => {
      if (!refreshToken || !document) return;
      const newTokens = await refreshSessionAction({
        refreshToken,
      });
      if (newTokens) {
        const { sessionToken, refreshToken } = newTokens;
        document.cookie = `session-id=${sessionToken}; path=/`;
        document.cookie = `refresh-token=${refreshToken}; path=/`;
      }
    };

    const clearCookies = () => {
      if (!document) return;
      document.cookie = `session-id=; path=/; max-age=0`;
      document.cookie = `refresh-token=; path=/; max-age=0`;
    };

    const checkAuth = async () => {
      try {
        if (!convexSessionId) {
          await refreshSession();
          return;
        }
        const isAuthenticated = await isAuthenticatedAction({
          convexSessionToken: convexSessionId,
        });
        if (!isAuthenticated && refreshToken) {
          await refreshSession();
        }
        if (!isAuthenticated) {
          clearCookies();
        }
        setSessionId(convexSessionId);
      } catch (error) {
        clearCookies();
        console.error(error);
      }
    };
    void checkAuth();
  }, [
    isAuthenticatedAction,
    convexSessionId,
    router,
    refreshToken,
    refreshSessionAction,
  ]);

  console.log("sessionId", sessionId);
  return (
    <ViewTokenContext.Provider
      value={{ tokenId: undefined, convexSessionId: sessionId }}
    >
      {children}
    </ViewTokenContext.Provider>
  );
};
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
