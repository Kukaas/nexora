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

/**
 * Tell clients a cached dataset changed so React Query refetches it (see
 * lib/query/keys.ts for the topic↔query-key map). Target the smallest audience
 * that cares: `toUser` reaches one person's open tabs, `toOfficials` the whole
 * officials' room. Passing neither broadcasts to everyone — use sparingly, only
 * for truly public data. A null/undefined `toUser` is ignored (e.g. walk-in
 * requests have no resident to notify), so it never accidentally broadcasts.
 */
export function emitInvalidate(
  topic: string,
  target: { toUser?: string | null; toOfficials?: boolean } = {},
): void {
  const io = getIO();
  if (!io) return;
  const payload = { topic };
  const { toUser, toOfficials } = target;

  if (toUser) io.to(`user:${toUser}`).emit("data:invalidate", payload);
  if (toOfficials) io.to("officials").emit("data:invalidate", payload);
  if (!toUser && !toOfficials) io.emit("data:invalidate", payload);
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
