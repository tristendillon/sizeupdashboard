import {
  usePaginatedQuery,
  useQuery,
  useAction,
  type PaginatedQueryArgs,
} from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { type FunctionReference, type FunctionArgs } from "convex/server";
import { api } from "@sizeupdashboard/convex/api/_generated/api";

// Cookie utility functions
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  const nameEQ = name + "=";
  const ca = document.cookie.split(";");

  for (const c of ca) {
    let cookie = c.trimStart();
    while (cookie.startsWith(" ")) cookie = cookie.substring(1, cookie.length);
    if (cookie.startsWith(nameEQ))
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
  }
  return null;
};

const setCookie = (name: string, value: string, days = 14) => {
  if (typeof document === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;secure;samesite=lax`;
};

const deleteCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

interface UseAuthenticatedPaginatedQueryOptions {
  onAuthenticationError?: () => void;
  onTokenRefresh?: (tokens: {
    sessionToken: string;
    refreshToken: string;
  }) => void;
  initialNumItems?: number;
  skipOnUnauthenticated?: boolean;
}

export function useAuthenticatedPaginatedQuery<
  Query extends FunctionReference<"query">,
>(
  queryFunction: Query,
  args: PaginatedQueryArgs<Query>,
  options: UseAuthenticatedPaginatedQueryOptions = {
    skipOnUnauthenticated: true,
  },
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshAction = useAction(api.auth.refreshSession);

  // Only access cookies after hydration to prevent SSR mismatch
  const sessionToken = getCookie("session-token");
  const refreshToken = getCookie("refresh-token");

  const isAuthenticated = useQuery(
    api.auth.getAuthenticatedSession,
    sessionToken
      ? {
          convexSessionToken: sessionToken,
        }
      : "skip",
  );

  // Function to refresh tokens
  const refreshTokens = useCallback(async () => {
    if (!refreshToken || isRefreshing) return false;

    setIsRefreshing(true);
    setAuthError(null);

    try {
      const newTokens = (await refreshAction({ refreshToken })) as {
        sessionToken: string;
        refreshToken: string;
      };

      // Update cookies with new tokens
      setCookie("session-token", newTokens.sessionToken);
      setCookie("refresh-token", newTokens.refreshToken);

      options.onTokenRefresh?.(newTokens);

      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      setAuthError("Authentication failed");

      // Clear invalid tokens
      deleteCookie("session-token");
      deleteCookie("refresh-token");

      options.onAuthenticationError?.();

      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshToken, refreshAction, isRefreshing, options]);

  // Auto-refresh when authentication fails but we have a refresh token
  useEffect(() => {
    if (
      (isAuthenticated === false || sessionToken === null) &&
      refreshToken &&
      !isRefreshing
    ) {
      void refreshTokens();
    }
  }, [
    isAuthenticated,
    refreshToken,
    refreshTokens,
    isRefreshing,
    sessionToken,
  ]);

  // Main query - only run if authenticated and we have session token
  const shouldRunQuery = isAuthenticated === true && sessionToken;

  const queryArgs =
    shouldRunQuery || !options.skipOnUnauthenticated
      ? ({
          ...args,
          convexSessionToken: sessionToken ?? undefined,
        } as FunctionArgs<Query>)
      : "skip";

  const mainQuery = usePaginatedQuery(queryFunction, queryArgs, {
    initialNumItems: options.initialNumItems ?? 10,
  });

  // Determine loading state
  const isLoading =
    isAuthenticated === undefined || // Still checking auth
    isRefreshing || // Currently refreshing
    (isAuthenticated === true && mainQuery.status === "LoadingFirstPage"); // Authenticated but query loading

  return {
    results: mainQuery.results,
    loadMore: mainQuery.loadMore,
    status: mainQuery.status,
    isLoading,
    isAuthenticated: isAuthenticated === true,
    isRefreshing,
    error: authError,
    refreshTokens,
    // Helper to check if we need authentication
    needsAuth: !sessionToken || !refreshToken,
  };
}
