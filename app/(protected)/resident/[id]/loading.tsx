import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown the instant a resident taps a sidebar link, while the destination
 * server component streams in. Living at the [id] segment, this one boundary
 * wraps the overview page and every child route below it (announcements,
 * messages, requests, request, officials, profile…), so navigation feels
 * immediate everywhere and the sidebar/header stay put.
 *
 * The layout mirrors a typical resident page — a heading plus a main column and
 * a side card — and is responsive: the aside is hidden on phones (where pages
 * stack to one column) and appears alongside the main column from `lg` up.
 */
export default function ResidentLoading() {
  return (
    <div className="space-y-6 lg:space-y-8" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>

      {/* Page heading */}
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-28 rounded-lg" />
        <Skeleton className="h-8 w-48 rounded-xl sm:h-9 sm:w-64" />
        <Skeleton className="h-4 w-40 rounded-lg" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main column */}
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-4xl" />

          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-11 shrink-0 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3 rounded-lg" />
                    <Skeleton className="h-3 w-1/4 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full rounded-lg" />
                <Skeleton className="h-3 w-4/5 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Side card — hidden on phones (pages stack), shown from lg up */}
        <div className="hidden lg:block">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="space-y-2">
              <Skeleton className="h-5 w-24 rounded-lg" />
              <Skeleton className="h-3 w-40 rounded-lg" />
            </div>
            <div className="space-y-3 pt-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28 rounded-lg" />
                    <Skeleton className="h-3 w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
