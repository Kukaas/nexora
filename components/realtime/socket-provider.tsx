"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";

import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/lib/realtime/events";

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type SocketContextValue = {
  socket: ChatSocket | null;
  onlineIds: Set<string>;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  onlineIds: new Set(),
});

/**
 * Opens one authenticated socket.io connection for the current area and tracks
 * which user ids are currently online (presence). Mounted inside the resident
 * shell and the officials' messages area, so any chat UI under it shares a
 * single connection.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  // The socket is created once on mount. We expose it through state so consumers
  // re-render when it becomes available, and set it inside the "connect"
  // callback — never synchronously in the effect body. Presence updates arrive
  // through the socket's own callbacks.
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Same-origin connection; the cookie rides along so the server can auth it.
    const s: ChatSocket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    s.on("connect", () => setSocket(s));
    s.on("presence:state", ({ online }) => setOnlineIds(new Set(online)));

    return () => {
      s.removeAllListeners();
      s.disconnect();
    };
  }, []);

  const value = useMemo(() => ({ socket, onlineIds }), [socket, onlineIds]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}

/** Whether any of the given user ids is currently online. */
export function useAnyOnline(userIds: string[]): boolean {
  const { onlineIds } = useSocket();
  return userIds.some((id) => onlineIds.has(id));
}
