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
import { SocketProvider } from "@/components/realtime/socket-provider";
import { RealtimeInvalidator } from "@/components/realtime/realtime-invalidator";
import { CaptainSidebar } from "./captain-sidebar";

export type CaptainUser = {
  id: string;
  name: string;
  initials: string;
  image?: string | null;
};

export function CaptainShell({
  user,
  requestsInProgressCount,
  paymentsPendingCount,
  children,
}: {
  user: CaptainUser;
  requestsInProgressCount: number;
  paymentsPendingCount: number;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <SocketProvider>
      <RealtimeInvalidator />
      <SidebarProvider>
        <CaptainSidebar
          user={user}
          requestsInProgressCount={requestsInProgressCount}
          paymentsPendingCount={paymentsPendingCount}
        />
        <SidebarInset>
          {/* Print gets the content only: no sidebar, no app chrome. */}
          <style>{`@media print { [data-slot="sidebar"] { display: none !important; } }`}</style>
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6 print:hidden">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-5" />
            <NexoraGlyph className="size-7 text-primary md:hidden" />
            <span className="text-sm font-medium">Captain&apos;s office</span>
          </header>

          <div className="flex-1 bg-muted/30 print:bg-transparent">
            <div className="mx-auto w-full max-w-[96rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 print:p-0">
              {children}
            </div>
          </div>
        </SidebarInset>
        <Toaster position="top-center" richColors />
      </SidebarProvider>
      </SocketProvider>
    </TooltipProvider>
  );
}
