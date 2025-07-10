import { usePaginatedQuery, type PaginatedQueryArgs } from "convex/react";
import { type FunctionReference, type FunctionArgs } from "convex/server";
import { getCookie } from "@/utils/cookies";
import { useAuth } from "./use-auth";

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
  // Only access cookies after hydration to prevent SSR mismatch
  const sessionToken = getCookie("session-token");

  const { isAuthed, isLoading: isAuthLoading, authError } = useAuth(options);

  // Main query - only run if authenticated and we have session token
  const shouldRunQuery = isAuthed === true && sessionToken;

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
    isAuthLoading || // Still checking auth
    (isAuthed === true && mainQuery.status === "LoadingFirstPage"); // Authenticated but query loading

  return {
    results: mainQuery.results,
    loadMore: mainQuery.loadMore,
    status: mainQuery.status,
    isLoading,
    isAuthenticated: isAuthed,
    error: authError,
  };
}
