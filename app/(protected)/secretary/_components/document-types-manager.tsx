"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  LayoutTemplate,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { setDocumentTypeActive } from "@/lib/secretary-actions";
import { turnaroundLabel, type DocumentTypeDTO } from "@/lib/documents";
import { formatPeso } from "./secretary-ui";

/** "No requests yet" / "1 request" / "12 requests". */
function requestCountLabel(count: number): string {
  if (count === 0) return "No requests yet";
  return `${count} request${count === 1 ? "" : "s"}`;
}

export function DocumentTypesManager({
  types,
  basePath,
}: {
  types: DocumentTypeDTO[];
  /** Catalog route prefix, e.g. `/secretary/{id}/documents`. */
  basePath: string;
}) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleActive = async (type: DocumentTypeDTO, active: boolean) => {
    setTogglingId(type.id);
    const result = await setDocumentTypeActive({ id: type.id, active });
    setTogglingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      active ? `${type.name} is now requestable.` : `${type.name} turned off.`,
    );
    router.refresh();
  };

  const summary = useMemo(() => {
    return {
      total: types.length,
      active: types.filter((t) => t.active).length,
      inactive: types.filter((t) => !t.active).length,
      free: types.filter((t) => t.fee === 0).length,
      paid: types.filter((t) => t.fee > 0).length,
    };
  }, [types]);

  const filteredTypes = useMemo(() => {
    return types.filter((t) => {
      if (statusFilter !== "ALL") {
        if (statusFilter === "ACTIVE" && !t.active) return false;
        if (statusFilter === "INACTIVE" && t.active) return false;
        if (statusFilter === "FREE" && t.fee > 0) return false;
        if (statusFilter === "PAID" && t.fee === 0) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = t.name.toLowerCase().includes(q);
        const matchDesc = (t.description ?? "").toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }

      return true;
    });
  }, [types, statusFilter, searchQuery]);

  const pg = useClientPagination(filteredTypes, 10);

  const FILTERS = [
    { value: "ALL", label: "All Documents", count: types.length },
    { value: "ACTIVE", label: "Available", count: summary.active },
    { value: "INACTIVE", label: "Off / Hidden", count: summary.inactive },
    { value: "FREE", label: "Free", count: summary.free },
    { value: "PAID", label: "Fee Required", count: summary.paid },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Official Nexora KPI Stat Bar Suite */}
      <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
        <Stat label="Catalog document types" value={summary.total} />
        <Stat label="Available to residents" value={summary.active} accent />
        <Stat label="Free certificates" value={summary.free} />
        <Stat label="Fee-required permits" value={summary.paid} />
      </dl>

      {/* Filter Toolbar & Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
          <div
            role="tablist"
            aria-label="Filter document catalog"
            className="flex flex-1 gap-1 overflow-x-auto rounded-3xl bg-muted p-1"
          >
            {FILTERS.map((f) => {
              const active = statusFilter === f.value;
              return (
                <button
                  key={f.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setStatusFilter(f.value);
                    pg.setPage(1);
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-[1.25rem] px-3 py-2 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                    active
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "bg-border/70 text-muted-foreground"
                    )}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-44 sm:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="text"
                placeholder="Search document name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  pg.setPage(1);
                }}
                className="pl-9 pr-8 h-9 text-xs rounded-2xl bg-background border-border"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    pg.setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {filteredTypes.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>
              {types.length === 0 ? "No documents in catalog" : "No matching documents"}
            </EmptyTitle>
            <EmptyDescription>
              {types.length === 0
                ? "Add official document types that residents can request, like Barangay Clearance or Certificate of Indigency."
                : "Try clearing your search query or selecting a different status filter."}
            </EmptyDescription>
          </EmptyHeader>
          {types.length === 0 ? (
            <Button asChild>
              <Link href={`${basePath}/new`}>
                <Plus />
                Add your first document
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter("ALL");
                setSearchQuery("");
                pg.setPage(1);
              }}
            >
              Reset Filters
            </Button>
          )}
        </Empty>
      ) : (
        <>
          {/* Table — desktop view */}
          <TableCard className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 ps-5 text-xs font-medium tracking-wide text-muted-foreground">
                    Document Title
                  </TableHead>
                  <TableHead className="h-11 text-right text-xs font-medium tracking-wide text-muted-foreground">
                    Fee
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Turnaround
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Request Volume
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Available
                  </TableHead>
                  <TableHead className="h-11 w-24 pe-5 text-right text-xs font-medium tracking-wide text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.visible.map((type) => (
                  <TableRow
                    key={type.id}
                    className={cn(!type.active && "bg-muted/40")}
                  >
                    <TableCell className="ps-5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-medium text-foreground",
                            !type.active && "text-muted-foreground",
                          )}
                        >
                          {type.name}
                        </span>
                        {!type.active && <Badge variant="secondary">Off</Badge>}
                        {type.template && (
                          <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                            <LayoutTemplate className="size-3 text-primary" />
                            Template
                          </Badge>
                        )}
                      </div>
                      {type.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {type.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono text-xs font-medium tabular-nums",
                        !type.active && "text-muted-foreground",
                      )}
                    >
                      {type.fee > 0 ? formatPeso(type.fee) : "Free"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {turnaroundLabel(type.turnaroundDays)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {requestCountLabel(type.requestCount)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={type.active}
                        disabled={togglingId === type.id}
                        onCheckedChange={(v) => toggleActive(type, v)}
                        aria-label={`${type.active ? "Turn off" : "Turn on"} ${type.name}`}
                      />
                    </TableCell>
                    <TableCell className="pe-5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title={`Design layout for ${type.name}`}
                          aria-label={`Design layout for ${type.name}`}
                        >
                          <Link href={`${basePath}/${type.id}/design`}>
                            <LayoutTemplate
                              className={cn(
                                !type.template && "text-muted-foreground/60",
                              )}
                            />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title={`Edit ${type.name}`}
                          aria-label={`Edit ${type.name}`}
                        >
                          <Link href={`${basePath}/${type.id}/edit`}>
                            <Pencil />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          {/* Stacked rows — mobile view */}
          <ul className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card md:hidden">
            {pg.visible.map((type) => (
              <li
                key={type.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-4 transition-colors sm:gap-4 sm:px-5",
                  !type.active && "bg-muted/40",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span
                      className={cn(
                        "font-medium text-foreground",
                        !type.active && "text-muted-foreground",
                      )}
                    >
                      {type.name}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-xs font-medium tabular-nums",
                        type.active
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {type.fee > 0 ? formatPeso(type.fee) : "Free"}
                    </span>
                    {!type.active && <Badge variant="secondary">Off</Badge>}
                    {type.template && (
                      <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                        <LayoutTemplate className="size-3 text-primary" />
                        Template
                      </Badge>
                    )}
                  </div>
                  {type.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{turnaroundLabel(type.turnaroundDays)}</span>
                    <span className="text-muted-foreground/50" aria-hidden>
                      ·
                    </span>
                    <span>{requestCountLabel(type.requestCount)}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                  <Switch
                    checked={type.active}
                    disabled={togglingId === type.id}
                    onCheckedChange={(v) => toggleActive(type, v)}
                    aria-label={`${type.active ? "Turn off" : "Turn on"} ${type.name}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    aria-label={`Design layout for ${type.name}`}
                  >
                    <Link href={`${basePath}/${type.id}/design`}>
                      <LayoutTemplate
                        className={cn(
                          !type.template && "text-muted-foreground/60",
                        )}
                      />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    aria-label={`Edit ${type.name}`}
                  >
                    <Link href={`${basePath}/${type.id}/edit`}>
                      <Pencil />
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>

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
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex-1 px-5 py-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 flex items-center gap-2">
        {accent && <span className="size-2 rounded-full bg-primary" aria-hidden />}
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </dd>
    </div>
  );
}
