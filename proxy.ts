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
  if (hasSession) {
    const response = NextResponse.next();
    // Keep protected pages out of the browser's back/forward cache. Without
    // this, hitting "Back" after signing out — or after being bounced from a
    // role area — can restore a cached protected page from memory without ever
    // re-hitting the server, so the per-role guards in the layouts never run.
    // `no-store` forces a fresh request on Back, which re-runs those guards.
    response.headers.set(
      "Cache-Control",
      "no-store, max-age=0, must-revalidate",
    );
    return response;
  }

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
    "/change-password",
    "/start",
  ],
};
