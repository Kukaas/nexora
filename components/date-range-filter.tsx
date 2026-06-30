"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarDays, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type DatePreset = "TODAY" | "7D" | "30D" | "MONTH";

/**
 * The active date filter: nothing, a named period, or a custom day range. Kept
 * as a discriminated union so callers can derive exact bounds and a label
 * without re-deriving intent from loose dates. Reusable across any page that
 * filters a list by date.
 */
export type DateFilter =
  | { kind: "all" }
  | { kind: "preset"; preset: DatePreset }
  | { kind: "custom"; from: Date; to: Date };

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: "TODAY", label: "Today" },
  { value: "7D", label: "Last 7 days" },
  { value: "30D", label: "Last 30 days" },
  { value: "MONTH", label: "This month" },
];

const rangeLabel = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
});

/** Inclusive [start, end] bounds in ms, with null meaning "unbounded". */
export function dateBounds(filter: DateFilter): {
  start: number | null;
  end: number | null;
} {
  if (filter.kind === "all") return { start: null, end: null };

  if (filter.kind === "custom") {
    const start = new Date(filter.from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filter.to);
    end.setHours(23, 59, 59, 999);
    return { start: start.getTime(), end: end.getTime() };
  }

  const now = new Date();
  switch (filter.preset) {
    case "TODAY":
      return {
        start: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        ).getTime(),
        end: null,
      };
    case "MONTH":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
        end: null,
      };
    case "7D":
      return { start: now.getTime() - 7 * 86_400_000, end: null };
    case "30D":
      return { start: now.getTime() - 30 * 86_400_000, end: null };
  }
}

export function dateFilterLabel(filter: DateFilter): string {
  if (filter.kind === "all") return "All dates";
  if (filter.kind === "custom") {
    return `${rangeLabel.format(filter.from)} – ${rangeLabel.format(filter.to)}`;
  }
  return PRESETS.find((p) => p.value === filter.preset)?.label ?? "All dates";
}

export function DateRangeFilter({
  value,
  onChange,
  align = "end",
  className,
}: {
  value: DateFilter;
  onChange: (next: DateFilter) => void;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // The calendar edits a draft; nothing is applied until "Apply range" so a
  // single click never commits a half-finished range.
  const [draft, setDraft] = useState<DateRange | undefined>(
    value.kind === "custom" ? { from: value.from, to: value.to } : undefined,
  );

  const active = value.kind !== "all";
  const canApply = Boolean(draft?.from && draft?.to);

  function handleOpenChange(next: boolean) {
    if (next) {
      // Reopen with the current custom range loaded, or a blank slate.
      setDraft(
        value.kind === "custom"
          ? { from: value.from, to: value.to }
          : undefined,
      );
    }
    setOpen(next);
  }

  function choosePreset(next: DateFilter) {
    onChange(next);
    setOpen(false);
  }

  function applyCustom() {
    if (draft?.from && draft?.to) {
      onChange({ kind: "custom", from: draft.from, to: draft.to });
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Filter by date"
          className={cn(
            "inline-flex h-9 w-full items-center gap-2 rounded-3xl border border-transparent bg-input/50 px-3 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 sm:w-auto",
            className,
          )}
        >
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
          <span className={cn(!active && "text-muted-foreground")}>
            {dateFilterLabel(value)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Quick presets */}
          <div className="flex gap-1 overflow-x-auto border-b border-border p-2 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0">
            <PresetButton
              label="All dates"
              active={value.kind === "all"}
              onClick={() => choosePreset({ kind: "all" })}
            />
            {PRESETS.map((p) => (
              <PresetButton
                key={p.value}
                label={p.label}
                active={value.kind === "preset" && value.preset === p.value}
                onClick={() => choosePreset({ kind: "preset", preset: p.value })}
              />
            ))}
          </div>

          {/* Custom range: pick a start and an end, then apply. */}
          <div className="flex flex-col">
            <Calendar
              mode="range"
              numberOfMonths={1}
              autoFocus
              selected={draft}
              defaultMonth={draft?.from}
              disabled={{ after: new Date() }}
              onSelect={setDraft}
            />
            <div className="flex items-center justify-between gap-3 border-t border-border p-3">
              <span className="text-xs text-muted-foreground">
                {draft?.from
                  ? draft.to
                    ? `${rangeLabel.format(draft.from)} – ${rangeLabel.format(draft.to)}`
                    : `${rangeLabel.format(draft.from)} – pick an end date`
                  : "Pick a start and end date"}
              </span>
              <Button size="sm" onClick={applyCustom} disabled={!canApply}>
                Apply range
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PresetButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 rounded-2xl px-3 py-1.5 text-left text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 sm:w-40",
        active
          ? "bg-accent text-accent-foreground"
          : "text-foreground hover:bg-muted",
      )}
    >
      {label}
      {active && <Check className="size-4" aria-hidden />}
    </button>
  );
}
