import { useAction, useQuery } from "convex/react";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { deleteCookie, getCookie, setCookie } from "@/utils/cookies";
import { useCallback, useEffect, useState } from "react";

interface UseAuthOptions {
  onAuthenticationError?: () => void;
  onTokenRefresh?: (tokens: {
    sessionToken: string;
    refreshToken: string;
  }) => void;
}

export function useAuth(options: UseAuthOptions = {}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const sessionToken = getCookie("session-token");
  const refreshToken = getCookie("refresh-token");
  const refreshAction = useAction(api.auth.refreshSession);
  const isAuthed = useQuery(
    api.auth.getAuthenticatedSession,
    sessionToken
      ? {
          convexSessionToken: sessionToken,
        }
      : "skip",
  );
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

  useEffect(() => {
    if (
      (isAuthed === false || sessionToken === null) &&
      refreshToken &&
      !isRefreshing
    ) {
      void refreshTokens();
    }
  }, [isAuthed, refreshToken, refreshTokens, isRefreshing, sessionToken]);

  const isLoading = isAuthed === undefined;
  return {
    isAuthed: isAuthed === true,
    isLoading,
    authError,
  };
}
