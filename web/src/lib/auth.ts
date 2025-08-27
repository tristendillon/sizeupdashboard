import { NextResponse, type NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { env } from "@/env";

const convexClient = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);

export interface AuthResult {
  isAuthed: boolean;
  sessionToken?: string;
  refreshToken?: string;
  error?: string;
}

async function validateSession(sessionToken: string): Promise<boolean> {
  try {
    const result = await convexClient.query(api.auth.getAuthenticatedSession, {
      convexSessionToken: sessionToken,
    });
    return result === true;
  } catch (error) {
    console.error("Session validation failed:", error);
    return false;
  }
}

async function refreshSession(refreshToken: string): Promise<{
  sessionToken: string;
  refreshToken: string;
} | null> {
  try {
    const result = await convexClient.action(api.auth.refreshSession, {
      refreshToken,
    });
    return result as { sessionToken: string; refreshToken: string };
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}

export async function auth(request: NextRequest): Promise<AuthResult> {
  const sessionToken = request.cookies.get("session-token")?.value;
  const refreshToken = request.cookies.get("refresh-token")?.value;

  // No tokens available
  if (!sessionToken && !refreshToken) {
    return { isAuthed: false };
  }

  // Try to validate existing session token
  if (sessionToken) {
    const isValid = await validateSession(sessionToken);
    if (isValid) {
      return { isAuthed: true, sessionToken };
    }
  }

  // Session token invalid/missing, try to refresh
  if (refreshToken) {
    const newTokens = await refreshSession(refreshToken);
    if (newTokens) {
      return {
        isAuthed: true,
        sessionToken: newTokens.sessionToken,
        refreshToken: newTokens.refreshToken,
      };
    }
  }

  // All authentication attempts failed
  return { isAuthed: false, error: "Authentication failed" };
}

// Higher-order function for middleware
export function withAuth(
  handler: (
    req: NextRequest,
    authResult: AuthResult,
  ) => Promise<NextResponse> | NextResponse,
) {
  return async (request: NextRequest) => {
    const authResult = await auth(request);

    // If tokens were refreshed, we need to set new cookies
    let response = await handler(request, authResult);

    if (authResult.sessionToken && authResult.refreshToken) {
      // Clone response to modify headers
      response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      });

      // Set new cookies if tokens were refreshed
      if (
        request.cookies.get("session-token")?.value !== authResult.sessionToken
      ) {
        response.cookies.set("session-token", authResult.sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
      }

      if (
        request.cookies.get("refresh-token")?.value !== authResult.refreshToken
      ) {
        response.cookies.set("refresh-token", authResult.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
      }
    }

    // Clear cookies if authentication failed
    if (!authResult.isAuthed && authResult.error) {
      response.cookies.delete("session-token");
      response.cookies.delete("refresh-token");
    }

    return response;
  };
}
