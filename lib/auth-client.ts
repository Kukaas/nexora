import { createAuthClient } from "better-auth/react";

// No hardcoded baseURL: NEXT_PUBLIC_* values are inlined at build time, so a
// literal "http://localhost:3000" here would be baked into the browser bundle
// and break in production. Passing an explicit override only when the env var
// is set (build time) and otherwise letting better-auth fall back to the
// current origin (relative /api/auth) makes the client work on any domain.
// In browser contexts (window !== "undefined"), omit baseURL so better-auth defaults
// to relative requests (/api/auth) targeting the exact host and port currently being browsed.
// This prevents cross-origin "Failed to fetch" errors when running local dev (e.g. localhost:3001)
// while NEXT_PUBLIC_BETTER_AUTH_URL points to a production domain.
const isDev = process.env.NODE_ENV !== "production";
const devBaseUrl = `http://localhost:${process.env.PORT || 3001}`;
const configuredUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

export const authClient = createAuthClient({
  ...(typeof window === "undefined"
    ? {
        baseURL: isDev
          ? configuredUrl?.includes("localhost") || configuredUrl?.includes("127.0.0.1")
            ? configuredUrl
            : devBaseUrl
          : configuredUrl ?? "https://nexora.kukaass.app",
      }
    : {}),
});

export const { signIn, signUp, signOut, useSession } = authClient;
