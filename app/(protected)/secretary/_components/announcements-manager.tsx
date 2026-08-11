"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ImageIcon,
  Megaphone,
  Pencil,
  Pin,
  Plus,
  Search,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CATEGORY_LABELS, type AnnouncementDTO } from "@/lib/documents";
import { purokLabel } from "@/lib/purok";
import { formatDate } from "./secretary-ui";

export function AnnouncementsManager({
  announcements,
  basePath,
  showAudience = true,
}: {
  announcements: AnnouncementDTO[];
  /** Announcements route prefix, e.g. `/secretary/{id}/announcements`. */
  basePath: string;
  /** Hide the audience column when the list is already purok-scoped (kagawad). */
  showAudience?: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const summary = useMemo(() => {
    return {
      total: announcements.length,
      published: announcements.filter((a) => a.published).length,
      pinned: announcements.filter((a) => a.pinned).length,
      drafts: announcements.filter((a) => !a.published).length,
    };
  }, [announcements]);

  const filtered = useMemo(() => {
    return announcements.filter((a) => {
      if (statusFilter !== "ALL") {
        if (statusFilter === "PUBLISHED" && !a.published) return false;
        if (statusFilter === "PINNED" && !a.pinned) return false;
        if (statusFilter === "DRAFT" && a.published) return false;
      }
      if (categoryFilter !== "ALL" && a.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchBody = a.body.toLowerCase().includes(q);
        const matchPlace = (a.place ?? "").toLowerCase().includes(q);
        if (!matchTitle && !matchBody && !matchPlace) return false;
      }
      return true;
    });
  }, [announcements, statusFilter, categoryFilter, searchQuery]);

  const pg = useClientPagination(filtered, 10);

  const FILTERS = [
    { value: "ALL", label: "All Notices", count: announcements.length },
    { value: "PUBLISHED", label: "Published", count: summary.published },
    { value: "PINNED", label: "Pinned", count: summary.pinned },
    { value: "DRAFT", label: "Drafts", count: summary.drafts },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Official Nexora KPI Stat Bar Suite */}
      <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
        <Stat label="Total announcements" value={summary.total} />
        <Stat label="Published & live" value={summary.published} accent />
        <Stat label="Pinned to top" value={summary.pinned} />
        <Stat label="Saved drafts" value={summary.drafts} />
      </dl>

      {/* Filter Toolbar & Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
          <div
            role="tablist"
            aria-label="Filter community announcements"
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
            <div className="relative min-w-44 sm:w-56">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="text"
                placeholder="Search title, place..."
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

            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v);
                pg.setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px] text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Megaphone />
            </EmptyMedia>
            <EmptyTitle>
              {announcements.length === 0
                ? "No announcements yet"
                : "No matching announcements"}
            </EmptyTitle>
            <EmptyDescription>
              {announcements.length === 0
                ? "Post notices for residents, like a water interruption, a free vaccination drive, or the next barangay assembly."
                : "Try clearing your search query or selecting a different status/category filter."}
            </EmptyDescription>
          </EmptyHeader>
          {announcements.length === 0 ? (
            <Button asChild>
              <Link href={`${basePath}/new`}>
                <Plus />
                Write your first announcement
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter("ALL");
                setCategoryFilter("ALL");
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
          {/* Desktop Table View */}
          <TableCard className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 ps-5 text-xs font-medium tracking-wide text-muted-foreground">
                    Announcement
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Category
                  </TableHead>
                  {showAudience && (
                    <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                      Audience
                    </TableHead>
                  )}
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Event Date
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Posted
                  </TableHead>
                  <TableHead className="h-11 w-10 pe-5 text-right" aria-label="Edit" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.visible.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="ps-5">
                      <div className="flex items-center gap-3">
                        <Thumbnail src={a.imageUrl} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {a.pinned && (
                              <Pin
                                className="size-3.5 shrink-0 text-accent-foreground"
                                aria-label="Pinned"
                              />
                            )}
                            <span className="font-medium text-foreground">{a.title}</span>
                          </div>
                          <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-muted-foreground">
                            {a.place ? `${a.place} · ${a.body}` : a.body}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex h-6 items-center rounded-3xl border border-border px-2.5 text-xs font-medium text-muted-foreground">
                        {CATEGORY_LABELS[a.category]}
                      </span>
                    </TableCell>
                    {showAudience && (
                      <TableCell className="text-xs text-muted-foreground">
                        {purokLabel(a.purok)}
                      </TableCell>
                    )}
                    <TableCell className="text-xs text-muted-foreground tabular-nums font-mono">
                      {a.date ? formatDate(a.date) : "—"}
                    </TableCell>
                    <TableCell>
                      {a.published ? (
                        <span className="inline-flex h-6 items-center rounded-3xl bg-emerald-500/10 px-2.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex h-6 items-center rounded-3xl bg-muted px-2.5 text-xs font-medium text-muted-foreground">
                          Draft
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums font-mono">
                      {formatDate(a.createdAt)}
                    </TableCell>
                    <TableCell className="pe-5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title={`Edit ${a.title}`}
                        aria-label={`Edit ${a.title}`}
                      >
                        <Link href={`${basePath}/${a.id}/edit`}>
                          <Pencil />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          {/* Mobile Stacked View */}
          <ul className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card md:hidden">
            {pg.visible.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-4 sm:px-5">
                <Thumbnail src={a.imageUrl} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-6 items-center rounded-3xl border border-border px-2.5 text-xs font-medium text-muted-foreground">
                      {CATEGORY_LABELS[a.category]}
                    </span>
                    {showAudience && a.purok && (
                      <span className="inline-flex h-6 items-center rounded-3xl border border-border px-2.5 text-xs font-medium text-muted-foreground">
                        {purokLabel(a.purok)}
                      </span>
                    )}
                    {a.pinned && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-foreground">
                        <Pin className="size-3" aria-hidden />
                        Pinned
                      </span>
                    )}
                    {!a.published && (
                      <span className="inline-flex h-6 items-center rounded-3xl bg-muted px-2.5 text-xs font-medium text-muted-foreground">
                        Draft
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums font-mono">
                      {formatDate(a.createdAt)}
                    </span>
                  </div>
                  <p className="truncate font-medium text-foreground">{a.title}</p>
                  {a.date && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-accent-foreground">
                      <CalendarDays className="size-3.5" aria-hidden />
                      {formatDate(a.date)}
                    </p>
                  )}
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {a.body}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  title={`Edit ${a.title}`}
                  aria-label={`Edit ${a.title}`}
                  className="shrink-0"
                >
                  <Link href={`${basePath}/${a.id}/edit`}>
                    <Pencil />
                  </Link>
                </Button>
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

function Thumbnail({ src }: { src: string | null }) {
  if (!src) {
    return (
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
      >
        <ImageIcon className="size-4" />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="size-10 shrink-0 rounded-xl object-cover ring-1 ring-foreground/10"
    />
  );
}
