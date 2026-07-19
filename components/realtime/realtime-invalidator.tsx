"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { REFRESH_TOPICS, topicToQueryKey } from "@/lib/query/keys";
import { useSocket } from "./socket-provider";

/**
 * Bridges the realtime socket to the React Query cache. When a server action
 * mutates data it emits a `data:invalidate` topic over the socket; this listener
 * translates the topic to a query key and marks it stale, so React Query
 * refetches it once and every open tab updates live — without polling.
 *
 * Renders nothing. Mount it inside a shell that has both a SocketProvider and a
 * QueryClientProvider above it (e.g. the resident shell).
 */
export function RealtimeInvalidator() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;

    const onInvalidate = ({ topic }: { topic: string }) => {
      // Cached list data → refetch just that query.
      const queryKey = topicToQueryKey(topic);
      if (queryKey) void queryClient.invalidateQueries({ queryKey });
      // Server-rendered UI (gated by DB state) → re-run the server render.
      if (REFRESH_TOPICS.has(topic)) router.refresh();
    };

    socket.on("data:invalidate", onInvalidate);
    return () => {
      socket.off("data:invalidate", onInvalidate);
    };
  }, [socket, queryClient, router]);

  return null;
}
