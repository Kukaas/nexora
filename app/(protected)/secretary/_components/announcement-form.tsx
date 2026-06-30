"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AnnouncementCategory } from "@/app/generated/prisma/enums";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type AnnouncementDTO,
} from "@/lib/documents";
import { deleteAnnouncement, saveAnnouncement } from "@/lib/secretary-actions";

/** Parse an ISO date string to a Date, or undefined if absent/invalid. */
function isoToDate(iso: string | null): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * The secretary's new/edit announcement form, rendered full-width as its own
 * page (the list links here rather than opening a sheet). `editing` is null in
 * create mode. On success it returns to `backHref` — the announcements list.
 */
export function AnnouncementForm({
  editing,
  backHref,
}: {
  editing: AnnouncementDTO | null;
  backHref: string;
}) {
  const router = useRouter();
  const titleId = useId();
  const bodyId = useId();
  const placeId = useId();
  const dateId = useId();
  const pinnedId = useId();
  const publishedId = useId();

  const [title, setTitle] = useState(editing?.title ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [category, setCategory] = useState<AnnouncementCategory>(
    editing?.category ?? AnnouncementCategory.ADVISORY,
  );
  const [place, setPlace] = useState(editing?.place ?? "");
  const [date, setDate] = useState<Date | undefined>(() =>
    isoToDate(editing?.date ?? null),
  );
  const [pinned, setPinned] = useState(editing?.pinned ?? false);
  const [published, setPublished] = useState(editing?.published ?? true);
  const [dateOpen, setDateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const busy = saving || deleting;

  const save = async () => {
    if (!title.trim()) {
      toast.error("Give the notice a title.");
      return;
    }
    if (!body.trim()) {
      toast.error("Add the notice details.");
      return;
    }
    setSaving(true);
    const result = await saveAnnouncement({
      id: editing?.id,
      title: title.trim(),
      body: body.trim(),
      category,
      place: place.trim() || undefined,
      date: date ? format(date, "yyyy-MM-dd") : undefined,
      pinned,
      published,
    });
    if (!result.ok) {
      setSaving(false);
      toast.error(result.error);
      return;
    }
    toast.success(
      editing
        ? "Announcement updated."
        : published
          ? "Announcement published."
          : "Draft saved.",
    );
    router.push(backHref);
    router.refresh();
  };

  const remove = async () => {
    if (!editing) return;
    setDeleting(true);
    const result = await deleteAnnouncement({ id: editing.id });
    if (!result.ok) {
      setDeleting(false);
      toast.error(result.error);
      return;
    }
    toast.success("Announcement deleted.");
    router.push(backHref);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Announcements
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {editing ? "Edit announcement" : "New announcement"}
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground text-pretty">
          Write a notice for residents: what&apos;s happening, when, and what
          they need to do.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* The notice itself */}
        <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor={titleId}>Title</Label>
            <Input
              id={titleId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Scheduled water interruption"
              disabled={busy}
              autoFocus={!editing}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={bodyId}>Details</Label>
            <Textarea
              id={bodyId}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What residents need to know: who's affected, when, and what to do."
              rows={10}
              disabled={busy}
            />
          </div>
        </div>

        {/* Settings */}
        <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as AnnouncementCategory)}
              disabled={busy}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ORDER.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={dateId}>
              Date{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <div className="flex items-center gap-2">
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id={dateId}
                    type="button"
                    variant="outline"
                    disabled={busy}
                    className={cn(
                      "h-9 flex-1 justify-start rounded-3xl bg-input/50 px-3 font-normal hover:bg-input/50",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                    {date ? format(date, "PPP") : "When does it happen?"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(next) => {
                      setDate(next);
                      setDateOpen(false);
                    }}
                    captionLayout="dropdown"
                    defaultMonth={date ?? new Date()}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              {date && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={busy}
                  onClick={() => setDate(undefined)}
                  aria-label="Clear date"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              The day the event or advisory takes effect. Leave empty for ongoing
              notices.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={placeId}>Place</Label>
            <Input
              id={placeId}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Barangay covered court"
              disabled={busy}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-3xl border border-border px-4 py-3">
            <div>
              <Label htmlFor={pinnedId} className="text-sm font-medium">
                Pin to top
              </Label>
              <p className="text-xs text-muted-foreground">
                Keep this notice above the others in the resident feed.
              </p>
            </div>
            <Switch
              id={pinnedId}
              checked={pinned}
              onCheckedChange={setPinned}
              disabled={busy}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-3xl border border-border px-4 py-3">
            <div>
              <Label htmlFor={publishedId} className="text-sm font-medium">
                Publish now
              </Label>
              <p className="text-xs text-muted-foreground">
                Off keeps it as a draft only you can see.
              </p>
            </div>
            <Switch
              id={publishedId}
              checked={published}
              onCheckedChange={setPublished}
              disabled={busy}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {editing && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                disabled={busy}
                className="text-destructive hover:text-destructive"
              >
                {deleting ? <Spinner /> : <Trash2 />}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="font-medium text-foreground">
                    {editing.title}
                  </span>{" "}
                  will be removed from the resident feed. This can&apos;t be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>
                  Keep announcement
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={remove}
                  disabled={busy}
                >
                  Delete announcement
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" asChild disabled={busy}>
            <Link href={backHref}>Cancel</Link>
          </Button>
          <Button onClick={save} disabled={busy}>
            {saving && <Spinner />}
            {editing ? "Save changes" : published ? "Publish" : "Save draft"}
          </Button>
        </div>
      </div>
    </div>
  );
}
