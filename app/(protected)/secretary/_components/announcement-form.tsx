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
  BARANGAY,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  LIBTANGIN_VENUES,
  type AnnouncementDTO,
  type LibtanginVenue,
} from "@/lib/documents";
import { deleteAnnouncement, saveAnnouncement } from "@/lib/secretary-actions";
import {
  LibtanginMapPicker,
  type MapPoint,
} from "@/components/libtangin-map";
import { AnnouncementImageUpload } from "./announcement-image-upload";

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
  const startTimeId = useId();
  const endTimeId = useId();
  const pinnedId = useId();
  const publishedId = useId();

  const [title, setTitle] = useState(editing?.title ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [category, setCategory] = useState<AnnouncementCategory>(
    editing?.category ?? AnnouncementCategory.ADVISORY,
  );
  const [place, setPlace] = useState(editing?.place ?? "");
  const [point, setPoint] = useState<MapPoint | null>(() =>
    editing?.latitude != null && editing?.longitude != null
      ? { lat: editing.latitude, lng: editing.longitude }
      : null,
  );
  const [date, setDate] = useState<Date | undefined>(() =>
    isoToDate(editing?.date ?? null),
  );
  const [startTime, setStartTime] = useState(editing?.startTime ?? "");
  const [endTime, setEndTime] = useState(editing?.endTime ?? "");
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    editing?.imageUrl ?? undefined,
  );
  const [pinned, setPinned] = useState(editing?.pinned ?? false);
  const [published, setPublished] = useState(editing?.published ?? true);
  const [dateOpen, setDateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const busy = saving || deleting;

  /** Pick a listed landmark: fill the name and drop the pin on its spot. */
  const pickVenue = (venue: LibtanginVenue) => {
    setPlace(venue.name);
    setPoint({ lat: venue.lat, lng: venue.lng });
  };

  const save = async () => {
    if (!title.trim()) {
      toast.error("Give the notice a title.");
      return;
    }
    if (!body.trim()) {
      toast.error("Add the notice details.");
      return;
    }
    if (endTime && !startTime) {
      toast.error("Set a start time before an end time.");
      return;
    }
    if (startTime && endTime && endTime <= startTime) {
      toast.error("The end time should be after the start time.");
      return;
    }
    setSaving(true);
    const result = await saveAnnouncement({
      id: editing?.id,
      title: title.trim(),
      body: body.trim(),
      category,
      place: place.trim() || undefined,
      latitude: point?.lat,
      longitude: point?.lng,
      date: date ? format(date, "yyyy-MM-dd") : undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      imageUrl,
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
              rows={9}
              disabled={busy}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>
              Location on the map{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <LibtanginMapPicker
              value={point}
              onChange={setPoint}
              venues={LIBTANGIN_VENUES}
              onPickVenue={pickVenue}
              onRejectOutside={() =>
                toast.warning("That spot is outside Barangay Libtangin.", {
                  description: "Pick a place within the highlighted area.",
                })
              }
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              {point
                ? "Residents see this exact spot. Drag the pin to fine-tune, or tap a labeled place."
                : "Tap a labeled place, or anywhere on the map, to drop the pin. The map stays within Libtangin."}
            </p>
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
            <Label htmlFor={startTimeId}>
              Time{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span
                  id={`${startTimeId}-label`}
                  className="text-xs text-muted-foreground"
                >
                  From
                </span>
                <Input
                  id={startTimeId}
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={busy}
                  aria-labelledby={`${startTimeId}-label`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span
                  id={`${endTimeId}-label`}
                  className="text-xs text-muted-foreground"
                >
                  To
                </span>
                <Input
                  id={endTimeId}
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={busy || !startTime}
                  aria-labelledby={`${endTimeId}-label`}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              When the event starts and, if it helps, when it ends.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={placeId}>
              Location{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id={placeId}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Barangay Covered Court"
              disabled={busy}
            />
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Common venues">
              {LIBTANGIN_VENUES.map((venue) => {
                const active = place.trim() === venue.name;
                return (
                  <button
                    key={venue.name}
                    type="button"
                    disabled={busy}
                    aria-pressed={active}
                    onClick={() => {
                      if (active) {
                        setPlace("");
                        setPoint(null);
                      } else {
                        pickVenue(venue);
                      }
                    }}
                    className={cn(
                      "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50",
                      active
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {venue.name}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              A venue within {BARANGAY.name}, {BARANGAY.area}. Picking one drops
              the pin on the map. Leave empty for barangay-wide notices.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>
              Event image{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <AnnouncementImageUpload
              value={imageUrl}
              disabled={busy}
              onChange={setImageUrl}
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
