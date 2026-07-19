"use client";

import Link from "next/link";
import { FilePlus2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMyRequests } from "@/lib/query/use-my-requests";
import { formatShortDate, residentStatus } from "../_data";
import { StatusBadge } from "./status-badge";

/**
 * The dashboard's "My requests" summary. Reads the very same cached list as the
 * /requests page (shared React Query key), so it's served from cache on tab
 * switches and updates live when a socket `resident-requests` invalidation fires
 * — no separate fetch, no server round-trip. SSR-hydrated by the overview page.
 */
export function OverviewRequestsCard({ id }: { id: string }) {
  const { data } = useMyRequests();
  const requests = data ?? [];

  return (
    <section id="my-requests" className="scroll-mt-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            My requests
            {requests.length > 0 && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="-mr-1.5 text-muted-foreground"
              >
                <Link href={`/resident/${id}/requests`}>View all</Link>
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Documents you&apos;ve requested and where they stand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground text-pretty">
              You haven&apos;t requested any documents yet. Pick one above to get
              started.
            </p>
          ) : (
            <ul className="-my-1 divide-y divide-border">
              {requests.slice(0, 5).map((req) => (
                <li
                  key={req.id}
                  className="flex items-start justify-between gap-3 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {req.documentName}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {req.referenceNumber}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={residentStatus(req.status)} />
                    <span className="text-[0.6875rem] text-muted-foreground tabular-nums">
                      Updated {formatShortDate(req.reviewedAt ?? req.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" size="lg">
            <Link href={`/resident/${id}/request`}>
              <FilePlus2 />
              Request a document
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
