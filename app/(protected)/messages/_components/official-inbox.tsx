"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSocket } from "@/components/realtime/socket-provider";
import type { InboxItem } from "@/lib/chat-data";

export function OfficialInbox({ items }: { items: InboxItem[] }) {
  const { socket, onlineIds } = useSocket();
  const router = useRouter();
  const pathname = usePathname();

  // A new message anywhere refreshes the server-rendered list (order + unread).
  useEffect(() => {
    if (!socket) return;
    const onBump = () => router.refresh();
    socket.on("inbox:bump", onBump);
    return () => {
      socket.off("inbox:bump", onBump);
    };
  }, [socket, router]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h1 className="text-base font-semibold tracking-tight">Messages</h1>
        <p className="text-xs text-muted-foreground">
          Residents reaching the barangay desk
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="size-5" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground text-pretty">
            No messages yet. Resident conversations show up here.
          </p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto py-1">
          {items.map((item) => {
            const active = pathname === `/messages/${item.conversationId}`;
            const online = onlineIds.has(item.resident.id);
            return (
              <li key={item.conversationId}>
                <Link
                  href={`/messages/${item.conversationId}`}
                  className={cn(
                    "flex items-start gap-3 px-3 py-3 outline-none transition-colors focus-visible:bg-muted",
                    active ? "bg-accent/60" : "hover:bg-muted",
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="size-10">
                      {item.resident.image ? (
                        <AvatarImage src={item.resident.image} alt="" />
                      ) : null}
                      <AvatarFallback>
                        {initials(item.resident.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-card",
                        online ? "bg-emerald-500" : "bg-muted-foreground/40",
                      )}
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-sm",
                          item.unread ? "font-semibold" : "font-medium",
                        )}
                      >
                        {item.resident.name}
                      </span>
                      <span className="shrink-0 text-[0.6875rem] text-muted-foreground tabular-nums">
                        {formatWhen(item.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "truncate text-sm",
                          item.unread
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {item.lastFromResident ? "" : "You: "}
                        {item.preview}
                      </p>
                      {item.unread && (
                        <span
                          className="ml-auto size-2 shrink-0 rounded-full bg-primary"
                          aria-label="Unread"
                        />
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat("en-US", {
    ...(sameDay
      ? { hour: "numeric", minute: "2-digit" }
      : { month: "short", day: "numeric" }),
    timeZone: "Asia/Manila",
  }).format(d);
}
