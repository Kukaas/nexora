"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const pg = useClientPagination(types, 10);

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

  const activeCount = types.filter((t) => t.active).length;

  return (
    <div className="flex flex-col gap-5">
      {types.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">
              {types.length}
            </span>{" "}
            {types.length === 1 ? "document" : "documents"}
            <span className="px-1.5 text-muted-foreground/60" aria-hidden>
              ·
            </span>
            <span className="font-medium text-foreground tabular-nums">
              {activeCount}
            </span>{" "}
            available to residents
          </p>
          <Button asChild>
            <Link href={`${basePath}/new`}>
              <Plus />
              Add document
            </Link>
          </Button>
        </div>
      )}

      {types.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>No documents yet</EmptyTitle>
            <EmptyDescription>
              Add the documents residents can request, like Barangay Clearance or
              Certificate of Indigency, and set a fee for each.
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link href={`${basePath}/new`}>
              <Plus />
              Add your first document
            </Link>
          </Button>
        </Empty>
      ) : (
        <>
          {/* Table — tablet and up */}
          <TableCard className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 ps-5 text-xs font-medium tracking-wide text-muted-foreground">
                    Document
                  </TableHead>
                  <TableHead className="h-11 text-right text-xs font-medium tracking-wide text-muted-foreground">
                    Fee
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Turnaround
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Requests
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Available
                  </TableHead>
                  <TableHead className="h-11 w-10 pe-5" aria-label="Edit" />
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
                            "font-medium",
                            !type.active && "text-muted-foreground",
                          )}
                        >
                          {type.name}
                        </span>
                        {!type.active && <Badge variant="secondary">Off</Badge>}
                      </div>
                      {type.description && (
                        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono tabular-nums",
                        !type.active && "text-muted-foreground",
                      )}
                    >
                      {type.fee > 0 ? formatPeso(type.fee) : "Free"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {turnaroundLabel(type.turnaroundDays)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          {/* Stacked rows — phones */}
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
                        "font-medium",
                        !type.active && "text-muted-foreground",
                      )}
                    >
                      {type.name}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-sm font-medium tabular-nums",
                        type.active
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {type.fee > 0 ? formatPeso(type.fee) : "Free"}
                    </span>
                    {!type.active && <Badge variant="secondary">Off</Badge>}
                  </div>
                  {type.description && (
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
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
