"use client";

import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NexoraGlyph } from "@/app/(auth)/_components/nexora-mark";
import { KagawadSidebar } from "./kagawad-sidebar";

export type KagawadUser = {
  id: string;
  name: string;
  initials: string;
  image?: string | null;
  /** Label of the assigned purok, e.g. "Purok 3"; null when unassigned. */
  purokLabel: string | null;
};

export function KagawadShell({
  user,
  children,
}: {
  user: KagawadUser;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <KagawadSidebar user={user} />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-5" />
            <NexoraGlyph className="size-7 text-primary md:hidden" />
            <span className="text-sm font-medium">Kagawad</span>
            {user.purokLabel && (
              <span className="ml-1 inline-flex h-6 items-center rounded-full bg-accent px-2.5 text-xs font-medium text-accent-foreground">
                {user.purokLabel}
              </span>
            )}
          </header>

          <div className="flex-1 bg-muted/30">
            <div className="mx-auto w-full max-w-[96rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              {children}
            </div>
          </div>
        </SidebarInset>
        <Toaster position="top-center" richColors />
      </SidebarProvider>
    </TooltipProvider>
  );
}
