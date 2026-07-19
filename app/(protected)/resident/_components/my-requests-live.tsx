"use client";

import { useMyRequests } from "@/lib/query/use-my-requests";
import { MyRequestsView } from "./my-requests-view";

/**
 * Thin client wrapper that feeds the cached "My requests" data into the
 * presentational {@link MyRequestsView}. Keeps the view dumb (it just renders a
 * list) while this component owns the cache subscription, so a socket
 * invalidation re-renders the list in place with no navigation.
 *
 * Data is present on first render thanks to the page's SSR prefetch + hydrate,
 * so there's no client loading flash.
 */
export function MyRequestsLive({
  basePath,
  requestHref,
}: {
  basePath: string;
  requestHref: string;
}) {
  const { data } = useMyRequests();
  return (
    <MyRequestsView
      requests={data ?? []}
      basePath={basePath}
      requestHref={requestHref}
    />
  );
}
