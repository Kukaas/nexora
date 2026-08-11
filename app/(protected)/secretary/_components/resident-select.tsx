"use client";

import * as React from "react";
import { ChevronsUpDown, User, UserX, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ResidentOption {
  id: string;
  name: string;
  email: string;
}

export interface ResidentSelectProps {
  residents: ResidentOption[];
  value: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allowClear?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function ResidentSelect({
  residents,
  value,
  onSelect,
  placeholder = "Search & select resident account...",
  searchPlaceholder = "Type name or email to search...",
  emptyText = "No registered resident account found.",
  allowClear = true,
  clearLabel = "Walk-in / Unregistered Complainant",
  disabled = false,
  className,
}: ResidentSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedResident = residents.find((r) => r.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between rounded-2xl bg-input/40 border border-input px-3.5 py-2.5 text-sm font-normal h-auto min-h-[42px] hover:bg-input/60 transition-colors",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate text-left">
            {selectedResident ? (
              <>
                <User className="size-4 shrink-0 text-primary" />
                <span className="truncate text-foreground font-medium">
                  {selectedResident.name}{" "}
                  <span className="text-muted-foreground font-normal text-xs">
                    ({selectedResident.email})
                  </span>
                </span>
              </>
            ) : allowClear ? (
              <>
                <UserX className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="flex items-center gap-2 truncate">
                  <span className="font-medium text-foreground">{clearLabel}</span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 rounded-full py-0 px-2"
                  >
                    Default
                  </Badge>
                </div>
              </>
            ) : (
              <>
                <User className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-muted-foreground">{placeholder}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {selectedResident && allowClear && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onSelect("");
                  }
                }}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                title="Reset to default option"
              >
                <X className="size-3.5" />
              </span>
            )}
            <ChevronsUpDown className="size-4 opacity-50 shrink-0" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0 rounded-3xl overflow-hidden shadow-lg border"
        align="start"
      >
        <Command className="rounded-3xl">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-64 p-1">
            <CommandEmpty className="py-6 text-xs text-muted-foreground text-center">
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {allowClear && (
                <CommandItem
                  value={`--none-- walk-in unregistered none clear ${clearLabel}`}
                  data-checked={!value}
                  onSelect={() => {
                    onSelect("");
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-2xl cursor-pointer py-2.5 px-3 mb-1.5 transition-all flex items-center justify-between",
                    !value
                      ? "bg-amber-500/15 text-amber-900 dark:text-amber-200 font-semibold border border-amber-500/30"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <UserX className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>{clearLabel}</span>
                  </div>
                  {!value ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-amber-500/20 border-amber-500/40 text-amber-800 dark:text-amber-300 rounded-full font-bold"
                    >
                      Active Default ✓
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">(Default)</span>
                  )}
                </CommandItem>
              )}
              {residents.map((r) => {
                const isSelected = value === r.id;
                return (
                  <CommandItem
                    key={r.id}
                    value={`${r.name} ${r.email}`}
                    data-checked={isSelected}
                    onSelect={() => {
                      onSelect(r.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "rounded-2xl cursor-pointer px-3 py-2 transition-colors",
                      isSelected && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                      <span className="font-medium text-foreground text-sm truncate">
                        {r.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {r.email}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
