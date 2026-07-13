"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  Download,
  FileText,
  Loader2,
  MessagesSquare,
  Paperclip,
  SendHorizontal,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  markOfficialRead,
  markResidentRead,
  sendOfficialMessage,
  sendResidentMessage,
  uploadChatAttachment,
  type MessageInput,
  type SendResult,
} from "@/lib/chat-actions";
import type { ChatMessageDTO } from "@/lib/realtime/events";
import { useSocket } from "@/components/realtime/socket-provider";

type Mode = "resident" | "official";

/** Messages from the same sender within this window stack into one visual group. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;
/** How close to the bottom counts as "following the conversation". */
const STICK_THRESHOLD_PX = 80;

export function ChatThread({
  mode,
  conversationId: initialConversationId,
  initialMessages,
  currentUserId,
  presenceUserIds,
  peer,
  emptyTitle,
  emptyBody,
  notice,
  framed = true,
  showAvatar = true,
  presenceStyle = "person",
}: {
  mode: Mode;
  conversationId: string | null;
  initialMessages: ChatMessageDTO[];
  currentUserId: string;
  presenceUserIds: string[];
  peer: { name: string; image?: string | null; subtitle?: string };
  emptyTitle: string;
  emptyBody: string;
  /** Shared-desk disclosure shown as a strip under the header. */
  notice?: string;
  /** Wrap the thread in a rounded card. Off makes it sit flush on the page. */
  framed?: boolean;
  /** Show the peer's avatar in the header (off for the shared barangay desk). */
  showAvatar?: boolean;
  /**
   * "person" reads presence as one peer (Active now / Offline). "desk" counts
   * how many of the tracked users are online, for the shared officials desk.
   */
  presenceStyle?: "person" | "desk";
}) {
  const { socket, onlineIds } = useSocket();
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState<ChatMessageDTO[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showJump, setShowJump] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const firstRender = useRef(true);
  // Whether the reader is pinned to the latest message; drives auto-scroll.
  const atBottomRef = useRef(true);

  const onlineCount = presenceUserIds.reduce(
    (n, id) => (onlineIds.has(id) ? n + 1 : n),
    0,
  );
  const online = onlineCount > 0;
  const statusText =
    presenceStyle === "desk"
      ? online
        ? `${onlineCount} ${onlineCount === 1 ? "official" : "officials"} online`
        : "Away · we'll reply soon"
      : online
        ? "Active now"
        : (peer.subtitle ?? "Offline");

  function scrollToBottom(smooth: boolean) {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto",
    });
  }

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    atBottomRef.current = distance < STICK_THRESHOLD_PX;
    if (atBottomRef.current && showJump) setShowJump(false);
  }

  // Stick to the newest message only when the reader is already at the bottom or
  // just sent one; otherwise surface a "new messages" pill instead of yanking.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (firstRender.current) {
      scrollToBottom(false);
      firstRender.current = false;
      return;
    }
    if (atBottomRef.current || last?.senderId === currentUserId) {
      scrollToBottom(true);
    } else {
      setShowJump(true);
    }
  }, [messages, currentUserId]);

  // Grow the composer with its content, up to the max height.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  // Join the conversation room and take live messages for it.
  useEffect(() => {
    if (!socket || !conversationId) return;
    const join = () => socket.emit("conversation:join", conversationId);
    join();
    socket.on("connect", join);

    const onNew = (payload: { conversationId: string; message: ChatMessageDTO }) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.some((m) => m.id === payload.message.id)
          ? prev
          : [...prev, payload.message],
      );
    };
    socket.on("message:new", onNew);

    return () => {
      socket.emit("conversation:leave", conversationId);
      socket.off("message:new", onNew);
      socket.off("connect", join);
    };
  }, [socket, conversationId]);

  // Whenever the last message is from the other party, mark the thread read.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.senderId === currentUserId) return;
    if (mode === "resident") void markResidentRead();
    else if (conversationId) void markOfficialRead(conversationId);
  }, [messages, mode, conversationId, currentUserId]);

  async function dispatch(input: MessageInput): Promise<SendResult> {
    return mode === "resident"
      ? sendResidentMessage(input)
      : sendOfficialMessage({ ...input, conversationId: conversationId ?? "" });
  }

  function appendSent(result: SendResult) {
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setConversationId(result.message.conversationId);
    setMessages((prev) =>
      prev.some((m) => m.id === result.message.id)
        ? prev
        : [...prev, result.message],
    );
  }

  async function sendText() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    try {
      appendSent(await dispatch({ kind: "TEXT", body }));
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  async function sendAttachment(file: File) {
    if (uploading || sending) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const up = await uploadChatAttachment(form);
      if (!up.ok) {
        toast.error(up.error);
        return;
      }
      appendSent(
        await dispatch({
          kind: up.kind,
          attachmentUrl: up.url,
          attachmentName: up.name,
          attachmentSize: up.size,
        }),
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-card",
        framed &&
          "rounded-4xl border border-border shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10",
      )}
    >
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
        {showAvatar && (
          <div className="relative">
            <Avatar className="size-10">
              {peer.image ? <AvatarImage src={peer.image} alt="" /> : null}
              <AvatarFallback>{initials(peer.name)}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-card transition-colors",
                online ? "bg-emerald-500" : "bg-muted-foreground/40",
              )}
              aria-hidden
            />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{peer.name}</p>
          <p
            className={cn(
              "flex items-center gap-1.5 truncate text-xs",
              online
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            {!showAvatar && (
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full transition-colors",
                  online ? "bg-emerald-500" : "bg-muted-foreground/40",
                )}
                aria-hidden
              />
            )}
            {statusText}
          </p>
        </div>
      </header>

      {/* Shared-desk disclosure */}
      {notice && (
        <p className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground sm:px-5">
          <Users className="size-3.5 shrink-0" aria-hidden />
          <span className="text-pretty">{notice}</span>
        </p>
      )}

      {/* Messages */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto overscroll-contain px-4 py-4 sm:px-5"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <MessagesSquare className="size-5" aria-hidden />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
                <p className="mx-auto max-w-xs text-sm text-muted-foreground text-pretty">
                  {emptyBody}
                </p>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col">
              {messages.map((m, i) => {
                const mine = m.senderId === currentUserId;
                const prev = messages[i - 1];
                const next = messages[i + 1];
                const time = new Date(m.createdAt).getTime();

                const newDay =
                  !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
                const groupedWithPrev =
                  !!prev &&
                  !newDay &&
                  prev.senderId === m.senderId &&
                  time - new Date(prev.createdAt).getTime() < GROUP_WINDOW_MS;
                const groupedWithNext =
                  !!next &&
                  dayKey(next.createdAt) === dayKey(m.createdAt) &&
                  next.senderId === m.senderId &&
                  new Date(next.createdAt).getTime() - time < GROUP_WINDOW_MS;

                return (
                  <li
                    key={m.id}
                    className={cn(!newDay && (groupedWithPrev ? "mt-0.5" : "mt-4"))}
                  >
                    {newDay && <DateDivider iso={m.createdAt} />}
                    <MessageRow
                      message={m}
                      mine={mine}
                      showName={!mine && !groupedWithPrev}
                      showTime={!groupedWithNext}
                      groupedWithPrev={groupedWithPrev}
                      groupedWithNext={groupedWithNext}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Jump to latest, shown when new messages land while scrolled up */}
        {showJump && (
          <button
            type="button"
            onClick={() => {
              scrollToBottom(true);
              setShowJump(false);
            }}
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium shadow-md ring-1 ring-foreground/5 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            New messages
            <ArrowDown className="size-3.5" aria-hidden />
          </button>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void sendAttachment(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || sending}
            aria-label="Attach a photo or file"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <Paperclip className="size-5" aria-hidden />
            )}
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendText();
              }
            }}
            rows={1}
            aria-label="Write a message"
            enterKeyHint="send"
            placeholder="Write a message…"
            className="max-h-32 min-h-10 flex-1 resize-none rounded-3xl border border-border bg-input/50 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />

          <button
            type="button"
            onClick={() => void sendText()}
            disabled={!text.trim() || sending}
            aria-label="Send message"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none transition-colors hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <SendHorizontal className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DateDivider({ iso }: { iso: string }) {
  return (
    <div className="my-3 flex items-center gap-3 first:mt-0">
      <span className="h-px flex-1 bg-border" aria-hidden />
      <span className="text-[0.6875rem] font-medium text-muted-foreground">
        {formatDateLabel(iso)}
      </span>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}

function MessageRow({
  message,
  mine,
  showName,
  showTime,
  groupedWithPrev,
  groupedWithNext,
}: {
  message: ChatMessageDTO;
  mine: boolean;
  showName: boolean;
  showTime: boolean;
  groupedWithPrev: boolean;
  groupedWithNext: boolean;
}) {
  // Flatten the corner on the sender's "spine" so stacked bubbles read as one run.
  const corner = cn(
    mine
      ? [groupedWithPrev && "rounded-tr-md", groupedWithNext && "rounded-br-md"]
      : [groupedWithPrev && "rounded-tl-md", groupedWithNext && "rounded-bl-md"],
  );

  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      {showName && (
        <span className="mb-0.5 ml-1 text-xs font-medium text-accent-foreground">
          {message.senderName}
        </span>
      )}
      <div className="max-w-[85%] sm:max-w-[75%]">
        <Bubble message={message} mine={mine} cornerClass={corner} />
      </div>
      {showTime && (
        <span className="mt-0.5 px-1 text-[0.6875rem] text-muted-foreground tabular-nums">
          {formatTime(message.createdAt)}
        </span>
      )}
    </div>
  );
}

function Bubble({
  message,
  mine,
  cornerClass,
}: {
  message: ChatMessageDTO;
  mine: boolean;
  cornerClass?: string;
}) {
  if (message.kind === "IMAGE" && message.attachmentUrl) {
    return (
      <a
        href={message.attachmentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-3xl ring-1 ring-foreground/10 outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={message.attachmentUrl}
          alt={message.attachmentName ?? "Shared photo"}
          loading="lazy"
          className="max-h-64 w-auto max-w-full object-cover"
        />
      </a>
    );
  }

  if (message.kind === "FILE" && message.attachmentUrl) {
    return (
      <a
        href={message.attachmentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center gap-3 rounded-3xl px-3.5 py-3 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
          mine
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-foreground hover:bg-muted/70",
          cornerClass,
        )}
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            mine ? "bg-primary-foreground/15" : "bg-background",
          )}
        >
          <FileText className="size-4.5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {message.attachmentName ?? "File"}
          </span>
          {message.attachmentSize != null && (
            <span
              className={cn(
                "block text-xs",
                mine ? "text-primary-foreground/80" : "text-muted-foreground",
              )}
            >
              {formatBytes(message.attachmentSize)}
            </span>
          )}
        </span>
        <Download className="size-4 shrink-0 opacity-70" aria-hidden />
      </a>
    );
  }

  return (
    <div
      className={cn(
        "rounded-3xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words",
        mine
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground",
        cornerClass,
      )}
    >
      {message.body}
    </div>
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(iso));
}

/** Calendar day in Manila time, as a comparable YYYY-MM-DD key. */
function dayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(iso));
}

/** "Today" / "Yesterday" / "July 12, 2026" — for date dividers between days. */
function formatDateLabel(iso: string): string {
  const key = dayKey(iso);
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (key === dayKey(now.toISOString())) return "Today";
  if (key === dayKey(yesterday.toISOString())) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(iso));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
