"use client";

import { useId, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DocumentField } from "@/lib/documents";

/**
 * One custom document field, rendered to match its configured type. Shared by
 * the resident request form and the secretary's walk-in form, so a field always
 * looks and validates the same wherever the answers are collected.
 */
export function DocumentFieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: DocumentField;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const id = useId();
  const [dateOpen, setDateOpen] = useState(false);
  const label = (
    <Label htmlFor={id}>
      {field.label}{" "}
      {!field.required && (
        <span className="font-normal text-muted-foreground">(optional)</span>
      )}
    </Label>
  );

  if (field.type === "date") {
    // Values are stored as "yyyy-MM-dd"; parse at local midnight so the date
    // never drifts a day across time zones.
    const selected = value ? new Date(`${value}T00:00:00`) : undefined;
    const valid = selected && !Number.isNaN(selected.getTime());
    return (
      <div className="flex flex-col gap-2">
        {label}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "h-9 w-full justify-start rounded-3xl bg-input/50 px-3 font-normal hover:bg-input/50",
                !valid && "text-muted-foreground",
              )}
            >
              <CalendarIcon
                className="size-4 text-muted-foreground"
                aria-hidden
              />
              {valid ? format(selected, "PPP") : `Select ${field.label.toLowerCase()}`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={valid ? selected : undefined}
              onSelect={(date) => {
                onChange(date ? format(date, "yyyy-MM-dd") : "");
                setDateOpen(false);
              }}
              captionLayout="dropdown"
              startMonth={new Date(1920, 0)}
              endMonth={new Date()}
              defaultMonth={valid ? selected : new Date(2000, 0)}
              disabled={{ after: new Date() }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="flex flex-col gap-2">
        {label}
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="flex flex-col gap-2">
        {label}
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {label}
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={field.type === "number" ? "numeric" : undefined}
        disabled={disabled}
      />
    </div>
  );
}
