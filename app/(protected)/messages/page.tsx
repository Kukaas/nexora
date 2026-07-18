import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Messages · Barangay Libtangin",
};

export default function MessagesIndexPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <MessagesSquare className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-medium text-foreground">Select a conversation</p>
        <p className="max-w-xs text-sm text-muted-foreground text-pretty">
          Pick a resident from the list to read and reply to their messages.
        </p>
      </div>
    </div>
  );
}
