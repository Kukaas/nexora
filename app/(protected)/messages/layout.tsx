import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getSession } from "@/lib/session";
import { isOfficial, resolveHomePath } from "@/lib/roles";
import { getOfficialInbox } from "@/lib/chat-data";
import type { UserRoles } from "@/app/generated/prisma/enums";
import { NexoraGlyph } from "@/app/(auth)/_components/nexora-mark";
import { Toaster } from "@/components/ui/sonner";
import { SocketProvider } from "@/components/realtime/socket-provider";
import { MessagesShell } from "./_components/messages-shell";
import { OfficialInbox } from "./_components/official-inbox";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const roles = session.user.roles as UserRoles[] | undefined;
  // The barangay message desk is staffed by officials; residents use their own
  // /resident/[id]/messages thread instead.
  if (!isOfficial(roles)) redirect("/start");

  const inbox = await getOfficialInbox();
  const home = resolveHomePath(roles);

  return (
    <SocketProvider>
      <div className="flex h-dvh flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-5">
          <Link
            href={home}
            className="inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <span aria-hidden className="h-5 w-px bg-border" />
          <NexoraGlyph className="size-6 text-primary" />
          <span className="text-sm font-medium">Barangay messages</span>
        </header>

        <MessagesShell inbox={<OfficialInbox items={inbox} />}>
          {children}
        </MessagesShell>
      </div>
      <Toaster position="top-center" richColors />
    </SocketProvider>
  );
}
