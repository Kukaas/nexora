"use client";

import { QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query/get-query-client";

/**
 * Client boundary that hands the shared QueryClient to everything below it.
 * Mounted high in the authenticated tree (the (protected) layout) so every area
 * shares one browser cache. `getQueryClient()` returns the singleton in the
 * browser, so this is safe to render on each navigation without losing cache.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
