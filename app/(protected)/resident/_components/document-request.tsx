import Link from "next/link";
import {
  BadgeCheck,
  ChevronRight,
  FileCheck2,
  FileText,
  HandHeart,
  House,
  Store,
  type LucideIcon,
} from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { turnaroundLabel, type DocumentTypeDTO } from "@/lib/documents";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});
const formatPeso = (n: number) => peso.format(n);

/** Pick an icon by document name so the catalog still reads at a glance. */
function iconForDocument(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("indigen")) return HandHeart;
  if (n.includes("residen")) return House;
  if (n.includes("business") || n.includes("permit")) return Store;
  if (n.includes("clearance")) return FileCheck2;
  if (n.includes("id")) return BadgeCheck;
  return FileText;
}

export function DocumentRequest({
  types,
  basePath,
}: {
  types: DocumentTypeDTO[];
  /** The resident portal root; each card links to `${basePath}/request/:id`. */
  basePath: string;
}) {
  return (
    <section id="request" aria-labelledby="request-heading" className="scroll-mt-20">
      <h2 id="request-heading" className="mb-1 text-lg font-semibold tracking-tight">
        Request a document
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Apply online and track it here. No need to line up at the hall.
      </p>

      {types.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>No documents available yet</EmptyTitle>
            <EmptyDescription>
              The barangay hasn&apos;t opened any documents for online requests
              yet. Check back soon.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {types.map((doc) => {
            const Icon = iconForDocument(doc.name);
            return (
              <Link
                key={doc.id}
                href={`${basePath}/request/${doc.id}`}
                className="group flex items-center gap-3.5 rounded-3xl border border-border bg-card p-4 text-left shadow-sm ring-1 ring-foreground/5 transition-colors outline-none hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/40 dark:ring-foreground/10"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">
                    {doc.name}
                  </span>
                  {doc.description && (
                    <span className="block truncate text-sm text-muted-foreground">
                      {doc.description}
                    </span>
                  )}
                  <span className="mt-0.5 flex items-center gap-2 text-xs">
                    <span className="font-mono font-medium text-foreground tabular-nums">
                      {formatPeso(doc.fee)}
                    </span>
                    <span className="text-muted-foreground">
                      · {turnaroundLabel(doc.turnaroundDays)}
                    </span>
                  </span>
                </span>
                <ChevronRight
                  aria-hidden
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
