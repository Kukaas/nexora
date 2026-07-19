import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from "@tanstack/react-query";

/**
 * One QueryClient factory shared by the server (a fresh client per request, so
 * requests never bleed into each other) and the browser (a single long-lived
 * client, so navigating between tabs reuses the cache instead of re-querying).
 *
 * `staleTime` is what makes tab switches cheap: data stays "fresh" for a minute,
 * so React Query serves it from cache without hitting the network/DB. Realtime
 * updates don't wait for that window — a socket `data:invalidate` event marks the
 * relevant query stale immediately (see components/realtime/realtime-invalidator).
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      dehydrate: {
        // Also ship queries still pending at render time, so SSR streaming works.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  // Reuse the client across renders/navigations in the browser. Recreating it
  // (e.g. on a React suspense retry) would drop the cache we're trying to keep.
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
