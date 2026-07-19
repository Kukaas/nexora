import { requireSession } from "@/lib/session";
import { QueryProvider } from "@/components/query-provider";

/**
 * Authentication boundary for everything under /(protected). Runs server-side
 * on every nested route, so even if the optimistic middleware is bypassed, an
 * unauthenticated request is redirected to /sign-in before any child renders.
 * Per-area role checks live in the role layouts nested below this one.
 *
 * Also the single place the React Query cache is provided, so every authenticated
 * area shares one browser cache (tab switches read cache, socket events refetch).
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return <QueryProvider>{children}</QueryProvider>;
}
