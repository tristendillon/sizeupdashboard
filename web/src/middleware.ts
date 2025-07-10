import { NextResponse, type NextRequest } from "next/server";
import { withAuth, type AuthResult } from "./server/middleware/auth";
import { createRouteMatcher } from "./server/route-matcher";

const isAuthPage = createRouteMatcher(["/login"]);
const isProtectedPage = createRouteMatcher([
  "/dashboard{/*path}",
  "/account{/*path}",
]);
export function customMiddlewareHandler(
  req: NextRequest,
  authResult: AuthResult,
) {
  console.log(authResult);
  if (isAuthPage(req) && authResult.isAuthed) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isProtectedPage(req) && !authResult.isAuthed) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const middleware = withAuth(customMiddlewareHandler);

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/login"],
};
