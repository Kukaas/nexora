"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Inbox } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { PaymentStatus } from "@/app/generated/prisma/enums";
import type { PaymentDTO } from "@/lib/payments";
import { reviewPayment } from "@/lib/treasurer-actions";
import {
  formatDateTime,
  formatPeso,
  MethodBadge,
  StatusBadge,
} from "./treasurer-ui";

type Filter = "ALL" | PaymentStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: PaymentStatus.PENDING, label: "Pending" },
  { value: PaymentStatus.VERIFIED, label: "Verified" },
  { value: PaymentStatus.REJECTED, label: "Rejected" },
  { value: "ALL", label: "All" },
];

export function PaymentsReview({ payments }: { payments: PaymentDTO[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>(PaymentStatus.PENDING);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      ALL: payments.length,
      [PaymentStatus.PENDING]: 0,
      [PaymentStatus.VERIFIED]: 0,
      [PaymentStatus.REJECTED]: 0,
    };
    for (const p of payments) base[p.status] += 1;
    return base;
  }, [payments]);

  const visible = useMemo(
    () => (filter === "ALL" ? payments : payments.filter((p) => p.status === filter)),
    [payments, filter],
  );

  const pg = useClientPagination(visible, 10);

  const selectFilter = (next: Filter) => {
    setFilter(next);
    pg.setPage(1);
  };

  const selected = payments.find((p) => p.id === selectedId) ?? null;

  return (
    <section aria-label="Payment submissions">
      {/* Filter tabs */}
      <div
        role="tablist"
        aria-label="Filter payments by status"
        className="flex w-full gap-1 overflow-x-auto rounded-3xl bg-muted p-1"
      >
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              role="tab"
              aria-selected={active}
              onClick={() => selectFilter(f.value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-[1.25rem] px-3 py-2 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums",
                  active ? "bg-accent text-accent-foreground" : "bg-border/70 text-muted-foreground",
                )}
              >
                {counts[f.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <EmptyFilterState filter={filter} />
      ) : (
        <>
          {/* Table — tablet and up */}
          <TableCard className="mt-5 hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 ps-5 text-xs font-medium tracking-wide text-muted-foreground">
                    Payer
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    For
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Submitted
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Method
                  </TableHead>
                  <TableHead className="h-11 text-right text-xs font-medium tracking-wide text-muted-foreground">
                    Amount
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-11 w-10 pe-5" aria-label="Open" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.visible.map((p) => (
                  <TableRow
                    key={p.id}
                    className="group relative cursor-pointer"
                  >
                    <TableCell className="ps-5 font-medium">
                      <button
                        onClick={() => setSelectedId(p.id)}
                        aria-label={`Review payment from ${p.payerName}`}
                        className="rounded-sm text-left outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30"
                      >
                        {p.payerName}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="line-clamp-1">{p.purpose}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {formatDateTime(p.createdAt)}
                    </TableCell>
                    <TableCell>
                      <MethodBadge method={p.method} />
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatPeso(p.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="pe-5 text-right">
                      <ChevronRight
                        className="ml-auto size-4 text-muted-foreground/70 transition-colors group-hover:text-foreground"
                        aria-hidden
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          {/* Stacked rows — phones */}
          <ul className="mt-5 divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card md:hidden">
            {pg.visible.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setSelectedId(p.id)}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {p.payerName}
                      </span>
                      <MethodBadge
                        method={p.method}
                        className="hidden sm:inline-flex"
                      />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {p.purpose}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(p.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="font-mono text-sm font-medium tabular-nums">
                      {formatPeso(p.amount)}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-5">
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
        </>
      )}

      <PaymentDetailSheet
        payment={selected}
        onClose={() => setSelectedId(null)}
        onReviewed={() => {
          setSelectedId(null);
          router.refresh();
        }}
      />
    </section>
  );
}

function EmptyFilterState({ filter }: { filter: Filter }) {
  const copy: Record<Filter, { title: string; description: string }> = {
    [PaymentStatus.PENDING]: {
      title: "Nothing to review",
      description: "When residents submit payments, they'll line up here for your check.",
    },
    [PaymentStatus.VERIFIED]: {
      title: "No verified payments yet",
      description: "Payments you approve will be collected here.",
    },
    [PaymentStatus.REJECTED]: {
      title: "No rejected payments",
      description: "Payments you send back will appear here with their reason.",
    },
    ALL: {
      title: "No payments yet",
      description: "Once residents start paying barangay fees, you'll see every submission here.",
    },
  };
  const { title, description } = copy[filter];
  return (
    <Empty className="mt-5 rounded-4xl border border-dashed border-border bg-card/50">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Inbox />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function PaymentDetailSheet({
  payment,
  onClose,
  onReviewed,
}: {
  payment: PaymentDTO | null;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<null | "VERIFIED" | "REJECTED">(null);

  // Reset the local review state whenever a different payment is opened/closed.
  const open = payment !== null;
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      onClose();
      setRejecting(false);
      setNote("");
    }
  };

  const submit = async (decision: "VERIFIED" | "REJECTED") => {
    if (!payment) return;
    if (decision === "REJECTED" && !note.trim()) {
      toast.error("Add a short reason so the resident knows what to fix.");
      return;
    }
    setPending(decision);
    const result = await reviewPayment({
      paymentId: payment.id,
      decision,
      note: decision === "REJECTED" ? note.trim() : undefined,
    });
    setPending(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      decision === "VERIFIED" ? "Payment verified." : "Payment sent back.",
    );
    setRejecting(false);
    setNote("");
    onReviewed();
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        {payment && (
          <>
            <SheetHeader className="border-b border-border px-5 py-4">
              <SheetTitle className="flex items-center justify-between gap-3">
                <span className="truncate">{payment.payerName}</span>
                <StatusBadge status={payment.status} />
              </SheetTitle>
              <SheetDescription className="sr-only">
                Payment details and review actions
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-3xl font-semibold tabular-nums">
                  {formatPeso(payment.amount)}
                </span>
                <MethodBadge method={payment.method} />
              </div>

              <dl className="mt-6 grid gap-px overflow-hidden rounded-3xl border border-border bg-border text-sm">
                <Row label="For">{payment.purpose}</Row>
                {payment.referenceNumber && (
                  <Row label="Reference no.">
                    <span className="font-mono">{payment.referenceNumber}</span>
                  </Row>
                )}
                {payment.payerEmail && <Row label="Resident">{payment.payerEmail}</Row>}
                <Row label="Submitted">{formatDateTime(payment.createdAt)}</Row>
                {payment.reviewedAt && (
                  <Row label="Reviewed">
                    {formatDateTime(payment.reviewedAt)}
                    {payment.reviewedByName ? ` · ${payment.reviewedByName}` : ""}
                  </Row>
                )}
              </dl>

              {/* Proof of payment */}
              <div className="mt-6">
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">
                  Proof of payment
                </p>
                {payment.proofImage ? (
                  <a
                    href={payment.proofImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-3xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={payment.proofImage}
                      alt={`Payment proof from ${payment.payerName}`}
                      loading="lazy"
                      className="max-h-80 w-full bg-muted object-contain"
                    />
                  </a>
                ) : (
                  <p className="rounded-3xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                    No screenshot attached. This was paid in cash at the hall.
                  </p>
                )}
              </div>

              {payment.reviewNote && (
                <div className="mt-5 rounded-3xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <p className="font-medium">Sent back</p>
                  <p className="mt-0.5">{payment.reviewNote}</p>
                </div>
              )}
            </div>

            {/* Review actions */}
            <div className="border-t border-border px-5 py-4">
              {rejecting ? (
                <div className="flex flex-col gap-3">
                  <Textarea
                    autoFocus
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What's wrong with this payment? e.g. the amount doesn't match, or the reference number is unreadable."
                    rows={3}
                    aria-label="Reason for sending back"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setRejecting(false);
                        setNote("");
                      }}
                      disabled={pending !== null}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => submit("REJECTED")}
                      disabled={pending !== null}
                    >
                      {pending === "REJECTED" && <Spinner />}
                      Confirm send back
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setRejecting(true)}
                    disabled={pending !== null}
                  >
                    {payment.status === PaymentStatus.REJECTED ? "Edit reason" : "Send back"}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => submit("VERIFIED")}
                    disabled={pending !== null || payment.status === PaymentStatus.VERIFIED}
                  >
                    {pending === "VERIFIED" && <Spinner />}
                    {payment.status === PaymentStatus.VERIFIED ? "Verified" : "Verify payment"}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 bg-card px-4 py-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium break-words">{children}</dd>
    </div>
  );
}
