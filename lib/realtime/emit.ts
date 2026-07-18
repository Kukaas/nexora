import "server-only";

import type { Server } from "socket.io";

import type { ChatMessageDTO } from "./events";

/**
 * The socket.io server is created by the custom server (server.ts) and stashed
 * on globalThis so server actions, which run in the same Node process, can push
 * realtime events after they persist. Returns null when the app runs without the
 * custom server (e.g. `next dev`), in which case realtime is simply skipped and
 * clients fall back to their next data load.
 */
function getIO(): Server | null {
  return (globalThis as unknown as { __nexoraIO?: Server }).__nexoraIO ?? null;
}

/** Fan a newly-saved message out to the open thread, the officials' inbox, and
 * the resident, so every relevant client updates without a refresh. */
export function emitNewMessage(
  residentId: string,
  message: ChatMessageDTO,
): void {
  const io = getIO();
  if (!io) return;
  const { conversationId } = message;
  io.to(`conv:${conversationId}`).emit("message:new", { conversationId, message });
  io.to("officials").emit("inbox:bump", { conversationId });
  io.to(`user:${residentId}`).emit("inbox:bump", { conversationId });
}
