"use client";

import {
  ChevronRight,
  FileCheck2,
  HandHeart,
  House,
  Store,
  type LucideIcon,
} from "lucide-react";

import { DOCUMENT_TYPES, type DocumentTypeKey } from "../_data";
import { announceComingSoon } from "./coming-soon";

const ICONS: Record<DocumentTypeKey, LucideIcon> = {
  clearance: FileCheck2,
  residency: House,
  indigency: HandHeart,
  business: Store,
};

export function QuickActions() {
  return (
    <section id="request" aria-labelledby="request-heading" className="scroll-mt-20">
      <h2
        id="request-heading"
        className="mb-1 text-lg font-semibold tracking-tight"
      >
        Request a document
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Apply online and track it here. No need to line up at the hall.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DOCUMENT_TYPES.map((doc) => {
          const Icon = ICONS[doc.key];
          return (
            <button
              key={doc.key}
              type="button"
              onClick={() => announceComingSoon(doc.name)}
              className="group flex items-center gap-3.5 rounded-3xl border border-border bg-card p-4 text-left shadow-sm ring-1 ring-foreground/5 transition-colors outline-none hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/40 dark:ring-foreground/10"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">
                  {doc.name}
                </span>
                <span className="block truncate text-sm text-muted-foreground">
                  {doc.blurb}
                </span>
                <span className="mt-0.5 block text-xs text-accent-foreground">
                  {doc.turnaround}
                </span>
              </span>
              <ChevronRight
                aria-hidden
                className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
