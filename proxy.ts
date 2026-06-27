import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic auth gate (Next's "proxy" convention, formerly middleware). This
 * only checks for the presence of a session cookie — it never hits the
 * database, so it's cheap and edge-safe. A cookie can be stale or forged, so it
 * is NOT the real check: every protected route is also guarded server-side in
 * `app/(protected)/layout.tsx` and the per-role layouts. The point here is just
 * to bounce signed-out visitors before we render a protected shell.
 */
export function proxy(request: NextRequest) {
  const hasSession = getSessionCookie(request);
  if (hasSession) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("redirect", pathname + search);
  return NextResponse.redirect(signIn);
}

export const config = {
  // Keep in sync with the folders under app/(protected)/.
  matcher: [
    "/resident/:path*",
    "/admin/:path*",
    "/captain/:path*",
    "/secretary/:path*",
    "/treasurer/:path*",
    "/kagawad/:path*",
    "/setup",
    "/start",
  ],
};
