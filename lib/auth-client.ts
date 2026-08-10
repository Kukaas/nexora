import { createAuthClient } from "better-auth/react";

// No hardcoded baseURL: NEXT_PUBLIC_* values are inlined at build time, so a
// literal "http://localhost:3000" here would be baked into the browser bundle
// and break in production. Passing an explicit override only when the env var
// is set (build time) and otherwise letting better-auth fall back to the
// current origin (relative /api/auth) makes the client work on any domain.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
