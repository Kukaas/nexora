import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, MessagesSquare } from "lucide-react";

import { getSession } from "@/lib/session";
import { getOfficialsDirectory } from "@/lib/chat-data";
import { OfficialsDirectory } from "./_components/officials-directory";

export const metadata: Metadata = {
  title: "Barangay officials · Barangay Libtangin",
};

export default async function ResidentOfficialsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.id !== id) redirect(`/resident/${session.user.id}/officials`);

  const officials = await getOfficialsDirectory();

  return (
    <div className="w-full space-y-6 lg:space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Barangay officials
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground text-pretty">
          The captain, council, and staff who serve Barangay Libtangin. Message
          the barangay and whoever is on duty will reply.
        </p>
      </header>

      <Link
        href={`/resident/${id}/messages`}
        className="group flex items-center gap-4 rounded-4xl border border-border bg-card p-5 shadow-sm ring-1 ring-foreground/5 transition-colors outline-none hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/40 sm:p-6 dark:ring-foreground/10"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <MessagesSquare className="size-6" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold tracking-tight">
            Message the barangay
          </span>
          <span className="block text-sm text-muted-foreground text-pretty">
            Send a message, photo, or file and reach an official right away.
          </span>
        </span>
        <ChevronRight
          aria-hidden
          className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
        />
      </Link>

      <OfficialsDirectory officials={officials} />
    </div>
  );
}
