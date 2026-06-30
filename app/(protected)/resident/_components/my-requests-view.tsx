"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, FilePlus2, LayoutGrid, Rows3 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DataPagination,
  DEFAULT_PAGE_SIZE_OPTIONS,
  TableCard,
  useClientPagination,
} from "@/components/ui/data-table";
import type { DocumentRequestDTO } from "@/lib/documents";
import { formatShortDate, residentStatus } from "../_data";
import { StatusBadge } from "./status-badge";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

type ViewMode = "card" | "table";

export function MyRequestsView({
  requests,
  basePath,
  requestHref,
}: {
  requests: DocumentRequestDTO[];
  /** Detail route prefix; each request links to `${basePath}/{id}`. */
  basePath: string;
  /** Where the "Request a document" actions point. */
  requestHref: string;
}) {
  // Cards by default — residents are almost always on a phone, where the
  // stacked cards read better than a wide table.
  const [view, setView] = useState<ViewMode>("card");
  const pg = useClientPagination(requests, 10);

  if (requests.length === 0) {
    return (
      <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FilePlus2 />
          </EmptyMedia>
          <EmptyTitle>No requests yet</EmptyTitle>
          <EmptyDescription>
            When you request a document, it shows up here so you can track where
            it stands.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={requestHref}>
            <FilePlus2 />
            Request a document
          </Link>
        </Button>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">
            {requests.length}
          </span>{" "}
          {requests.length === 1 ? "request" : "requests"}
        </p>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === "card" ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {pg.visible.map((req) => (
            <li key={req.id}>
              <Link
                href={`${basePath}/${req.id}`}
                className="group flex h-full flex-col gap-3 rounded-4xl border border-border bg-card p-4 shadow-sm ring-1 ring-foreground/5 outline-none transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/40 sm:p-5 dark:ring-foreground/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{req.documentName}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {req.referenceNumber}
                    </p>
                  </div>
                  <StatusBadge status={residentStatus(req.status)} />
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
                  <span className="font-mono font-medium tabular-nums">
                    {req.fee > 0 ? peso.format(req.fee) : "Free"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                    Updated {formatShortDate(req.reviewedAt ?? req.createdAt)}
                    <ChevronRight
                      className="size-4 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                      aria-hidden
                    />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 ps-5 text-xs font-medium tracking-wide text-muted-foreground">
                  Document
                </TableHead>
                <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                  Reference
                </TableHead>
                <TableHead className="h-11 text-right text-xs font-medium tracking-wide text-muted-foreground">
                  Fee
                </TableHead>
                <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                  Updated
                </TableHead>
                <TableHead className="h-11 pe-5 text-xs font-medium tracking-wide text-muted-foreground">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pg.visible.map((req) => (
                <TableRow key={req.id} className="group relative cursor-pointer">
                  <TableCell className="ps-5 font-medium">
                    <Link
                      href={`${basePath}/${req.id}`}
                      aria-label={`${req.documentName} · ${req.referenceNumber}`}
                      className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30"
                    >
                      {req.documentName}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {req.referenceNumber}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {req.fee > 0 ? peso.format(req.fee) : "Free"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {formatShortDate(req.reviewedAt ?? req.createdAt)}
                  </TableCell>
                  <TableCell className="pe-5">
                    <StatusBadge status={residentStatus(req.status)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}

      <DataPagination
        page={pg.page}
        pageCount={pg.pageCount}
        pageSize={pg.pageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        total={pg.total}
        from={pg.from}
        to={pg.to}
        onPageChange={pg.setPage}
        onPageSizeChange={pg.setPageSize}
      />
    </div>
  );
}

/** Card / table segmented toggle. */
function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (next: ViewMode) => void;
}) {
  const options: { value: ViewMode; label: string; icon: typeof LayoutGrid }[] =
    [
      { value: "card", label: "Cards", icon: LayoutGrid },
      { value: "table", label: "Table", icon: Rows3 },
    ];
  return (
    <div
      role="group"
      aria-label="Change layout"
      className="flex gap-1 rounded-2xl bg-muted p-1"
    >
      {options.map((opt) => {
        const active = view === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
