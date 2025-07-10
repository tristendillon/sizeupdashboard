import { useQuery } from "convex/react";
import { type FunctionReference, type FunctionArgs } from "convex/server";
import { getCookie } from "@/utils/cookies";
import { useAuth } from "./use-auth";

interface UseAuthenticatedQueryOptions {
  onAuthenticationError?: () => void;
  onTokenRefresh?: (tokens: {
    sessionToken: string;
    refreshToken: string;
  }) => void;
}

export function useAuthenticatedQuery<Query extends FunctionReference<"query">>(
  queryFunction: Query,
  args: FunctionArgs<Query>,
  options: UseAuthenticatedQueryOptions = {},
) {
  const sessionToken = getCookie("session-token");

  const { isAuthed, isLoading: isAuthLoading, authError } = useAuth(options);

  // Main query - only run if authenticated and we have session token
  const shouldRunQuery = isAuthed === true && sessionToken;

  const queryArgs = shouldRunQuery
    ? ({
        ...args,
        convexSessionToken: sessionToken,
      } as FunctionArgs<Query>)
    : "skip";

  console.log("queryArgs", queryArgs);

  const mainQuery = useQuery(queryFunction, queryArgs as FunctionArgs<Query>);

  // Determine loading state
  const isLoading =
    isAuthLoading || // Still checking auth
    (isAuthed === true && mainQuery === undefined); // Authenticated but query loading

  return {
    data: mainQuery,
    isLoading,
    isAuthenticated: isAuthed,
    error: authError,
    // Helper to check if we need authentication
  };
}
