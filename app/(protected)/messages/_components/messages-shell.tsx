"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Two-pane messages layout. On desktop the inbox sits beside the open thread; on
 * mobile only one shows at a time (inbox at /messages, thread at /messages/:id).
 */
export function MessagesShell({
  inbox,
  children,
}: {
  inbox: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const onThread = /^\/messages\/.+/.test(pathname);

  return (
    <div className="flex min-h-0 flex-1">
      <aside
        className={cn(
          "w-full flex-col overflow-y-auto border-border bg-card lg:flex lg:w-80 lg:shrink-0 lg:border-r xl:w-96",
          onThread ? "hidden lg:flex" : "flex",
        )}
      >
        {inbox}
      </aside>
      <main
        className={cn(
          "min-h-0 flex-1 bg-muted/30 p-3 sm:p-4",
          onThread ? "flex" : "hidden lg:flex",
        )}
      >
        {children}
      </main>
    </div>
  );
}
