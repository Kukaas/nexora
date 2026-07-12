"use client";

import Link from "next/link";
import {
  CalendarDays,
  ImageIcon,
  Megaphone,
  Pencil,
  Pin,
  Plus,
} from "lucide-react";

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
import { CATEGORY_LABELS, type AnnouncementDTO } from "@/lib/documents";
import { formatDate } from "./secretary-ui";

export function AnnouncementsManager({
  announcements,
  basePath,
}: {
  announcements: AnnouncementDTO[];
  /** Announcements route prefix, e.g. `/secretary/{id}/announcements`. */
  basePath: string;
}) {
  const pg = useClientPagination(announcements, 10);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-end">
        <Button asChild>
          <Link href={`${basePath}/new`}>
            <Plus />
            New announcement
          </Link>
        </Button>
      </div>

      {announcements.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Megaphone />
            </EmptyMedia>
            <EmptyTitle>No announcements yet</EmptyTitle>
            <EmptyDescription>
              Post notices for residents, like a water interruption, a free
              vaccination drive, or the next barangay assembly.
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link href={`${basePath}/new`}>
              <Plus />
              Write your first announcement
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
                    Announcement
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Category
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Posted
                  </TableHead>
                  <TableHead className="h-11 w-10 pe-5" aria-label="Edit" />
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
                            <span className="font-medium">{a.title}</span>
                          </div>
                          <p className="mt-0.5 line-clamp-1 max-w-md text-sm text-muted-foreground">
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
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {a.date ? formatDate(a.date) : "—"}
                    </TableCell>
                    <TableCell>
                      {a.published ? (
                        <span className="text-sm text-muted-foreground">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex h-6 items-center rounded-3xl bg-muted px-2.5 text-xs font-medium text-muted-foreground">
                          Draft
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {formatDate(a.createdAt)}
                    </TableCell>
                    <TableCell className="pe-5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
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

          {/* Stacked rows — phones */}
          <ul className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card md:hidden">
            {pg.visible.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-4 sm:px-5">
                <Thumbnail src={a.imageUrl} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-6 items-center rounded-3xl border border-border px-2.5 text-xs font-medium text-muted-foreground">
                      {CATEGORY_LABELS[a.category]}
                    </span>
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
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatDate(a.createdAt)}
                    </span>
                  </div>
                  <p className="truncate font-medium">{a.title}</p>
                  {a.date && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-accent-foreground">
                      <CalendarDays className="size-3.5" aria-hidden />
                      {formatDate(a.date)}
                    </p>
                  )}
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                    {a.body}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  asChild
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

/**
 * A small square preview of an announcement's event image in the list, with a
 * neutral image-glyph placeholder when the notice has no picture. Fixed size so
 * every row lines up whether or not it carries an image.
 */
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
    // Cloudinary delivery URL; plain img avoids remotePatterns config.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      className="size-10 shrink-0 rounded-xl object-cover ring-1 ring-foreground/10"
    />
  );
}
