"use client";

import { FilePlus2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NexoraGlyph } from "@/app/(auth)/_components/nexora-mark";
import { ResidentSidebar } from "./resident-sidebar";
import { announceComingSoon } from "./coming-soon";

export type ResidentUser = {
  id: string;
  name: string;
  initials: string;
  image?: string | null;
};

export function ResidentShell({
  user,
  children,
}: {
  user: ResidentUser;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <ResidentSidebar user={user} />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-5" />
            <NexoraGlyph className="size-7 text-primary md:hidden" />
            <span className="text-sm font-medium">Resident portal</span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                className="hidden sm:inline-flex"
                onClick={() => announceComingSoon("Document requests")}
              >
                <FilePlus2 />
                Request a document
              </Button>
            </div>
          </header>

          <div className="flex-1 bg-muted/30">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              {children}
            </div>
          </div>
        </SidebarInset>
        <Toaster position="top-center" richColors />
      </SidebarProvider>
    </TooltipProvider>
  );
}
