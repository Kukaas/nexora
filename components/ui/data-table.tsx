"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Shared presentational pieces for the app's data tables, so every table reads
 * the same regardless of which role console it lives in. The data, columns, and
 * filters stay with each feature; only the framing and pagination chrome are
 * centralized here. Pair with the `@/components/ui/table` primitives inside.
 */

/** The page sizes offered by default in the rows-per-page control. */
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Client-side pagination over an in-memory array, for tables that already have
 * all their rows (search/filter happens on the client). Returns the current
 * page's slice plus everything `DataPagination` needs. The page is clamped to
 * the available range, so when a filter shrinks the list the view follows.
 */
export function useClientPagination<T>(items: T[], initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);
  const visible = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  return {
    page: safePage,
    pageSize,
    pageCount,
    total,
    from,
    to,
    visible,
    setPage,
    setPageSize: (n: number) => {
      setPageSize(n);
      setPage(1);
    },
  };
}

/**
 * The framed surface a `<Table>` sits in: one hairline-bordered, soft-cornered
 * card with horizontal scroll for narrow viewports. Use `scrollX={false}` when
 * the caller manages its own overflow (e.g. a desktop-only table paired with a
 * separate mobile list).
 */
export function TableCard({
  className,
  scrollX = true,
  children,
}: {
  className?: string;
  scrollX?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-4xl border border-border bg-card",
        className,
      )}
    >
      {scrollX ? <div className="overflow-x-auto">{children}</div> : children}
    </div>
  );
}

/**
 * The pagination bar shared by server-paginated tables: rows-per-page, a live
 * "showing x–y of z" range, and previous/next controls. `from`/`to` are passed
 * in rather than derived so the range always matches the page actually shown,
 * even mid-transition after a page-size change.
 */
export function DataPagination({
  page,
  pageCount,
  pageSize,
  pageSizeOptions,
  total,
  from,
  to,
  pending = false,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions: number[];
  total: number;
  from: number;
  to: number;
  pending?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Rows per page
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger size="sm" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p
          className="flex items-center gap-2 text-sm text-muted-foreground"
          aria-live="polite"
        >
          {pending && <Loader className="size-3.5 animate-spin" aria-hidden />}
          <span>
            Showing{" "}
            <span className="font-medium text-foreground tabular-nums">
              {from}–{to}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground tabular-nums">
              {total}
            </span>
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground tabular-nums sm:inline">
          Page {page} of {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || pending}
        >
          <ChevronLeft data-icon="inline-start" aria-hidden />
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount || pending}
        >
          Next
          <ChevronRight data-icon="inline-end" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
