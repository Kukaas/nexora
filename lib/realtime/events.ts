/**
 * The realtime contract shared by the socket server, the browser client, and
 * the server actions that emit. Types only, safe to import from either side.
 */

export type ChatKind = "TEXT" | "IMAGE" | "FILE";

export type ChatMessageDTO = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderImage: string | null;
  /** True when the message came from a barangay official (vs the resident). */
  senderIsOfficial: boolean;
  kind: ChatKind;
  body: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentSize: number | null;
  createdAt: string;
};

export type PresenceState = { online: string[] };

/** Events the server pushes to clients. */
export interface ServerToClientEvents {
  "presence:state": (state: PresenceState) => void;
  "message:new": (payload: {
    conversationId: string;
    message: ChatMessageDTO;
  }) => void;
  "inbox:bump": (payload: { conversationId: string }) => void;
  /**
   * "Some cached dataset changed — refetch it." `topic` names the dataset (see
   * lib/query/keys.ts); the client maps it to a React Query key and invalidates.
   * Scoped by the room it's emitted to (a user's own room, or "officials").
   */
  "data:invalidate": (payload: { topic: string }) => void;
  typing: (payload: {
    conversationId: string;
    userId: string;
    typing: boolean;
  }) => void;
}

/** Events clients send to the server. */
export interface ClientToServerEvents {
  "conversation:join": (
    conversationId: string,
    ack?: (res: { ok: boolean }) => void,
  ) => void;
  "conversation:leave": (conversationId: string) => void;
  typing: (payload: { conversationId: string; typing: boolean }) => void;
}
