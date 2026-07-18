"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSocket } from "@/components/realtime/socket-provider";
import type { OfficialDirectoryEntry } from "@/lib/chat-data";

export function OfficialsDirectory({
  officials,
}: {
  officials: OfficialDirectoryEntry[];
}) {
  const { onlineIds } = useSocket();
  const onlineCount = officials.filter((o) => onlineIds.has(o.id)).length;

  return (
    <section aria-labelledby="directory-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="directory-heading" className="text-sm font-medium text-foreground">
          {officials.length} {officials.length === 1 ? "official" : "officials"}
        </h2>
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <span
            className={cn(
              "size-2 rounded-full",
              onlineCount > 0 ? "bg-emerald-500" : "bg-muted-foreground/40",
            )}
            aria-hidden
          />
          {onlineCount > 0 ? `${onlineCount} online now` : "None online"}
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {officials.map((o) => {
          const online = onlineIds.has(o.id);
          return (
            <li
              key={o.id}
              className="flex items-center gap-3 rounded-4xl border border-border bg-card p-4 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10"
            >
              <div className="relative shrink-0">
                <Avatar className="size-11">
                  {o.image ? <AvatarImage src={o.image} alt="" /> : null}
                  <AvatarFallback>{initials(o.name)}</AvatarFallback>
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
                <p className="truncate text-sm font-semibold">{o.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {o.roleLabel}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-xs font-medium",
                  online
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground",
                )}
              >
                {online ? "Active" : "Away"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
