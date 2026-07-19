"use client";

import { useQuery } from "@tanstack/react-query";

import type { DocumentRequestDTO } from "@/lib/documents";
import { queryKeys } from "@/lib/query/keys";

async function fetchMyRequests(): Promise<DocumentRequestDTO[]> {
  const res = await fetch("/api/resident/requests", {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("Failed to load requests");
  return res.json();
}

/**
 * The resident's "My requests" list from the shared client cache. The first
 * render is served from data hydrated on the server (no request fired); tab
 * switches reuse the cache; a socket `resident-requests` invalidation refetches
 * this exactly once so the resident sees an official's decision live.
 */
export function useMyRequests() {
  return useQuery({
    queryKey: queryKeys.residentRequests,
    queryFn: fetchMyRequests,
  });
}
