import { requireSession } from "@/lib/session";

/**
 * Authentication boundary for everything under /(protected). Runs server-side
 * on every nested route, so even if the optimistic middleware is bypassed, an
 * unauthenticated request is redirected to /sign-in before any child renders.
 * Per-area role checks live in the role layouts nested below this one.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return <>{children}</>;
}
