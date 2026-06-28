"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Pencil, Pin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { AnnouncementCategory } from "@/app/generated/prisma/enums";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type AnnouncementDTO,
} from "@/lib/documents";
import { deleteAnnouncement, saveAnnouncement } from "@/lib/secretary-actions";
import { formatDate } from "./secretary-ui";

type EditorState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; announcement: AnnouncementDTO };

export function AnnouncementsManager({
  announcements,
}: {
  announcements: AnnouncementDTO[];
}) {
  const router = useRouter();
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-end">
        <Button onClick={() => setEditor({ mode: "create" })}>
          <Plus />
          New announcement
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
          <Button onClick={() => setEditor({ mode: "create" })}>
            <Plus />
            Write your first announcement
          </Button>
        </Empty>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card">
          {announcements.map((a) => (
            <li key={a.id} className="flex items-start gap-4 px-4 py-4 sm:px-5">
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
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {a.body}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditor({ mode: "edit", announcement: a })}
                aria-label={`Edit ${a.title}`}
                className="shrink-0"
              >
                <Pencil />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AnnouncementEditor
        state={editor}
        onClose={() => setEditor({ mode: "closed" })}
        onSaved={() => {
          setEditor({ mode: "closed" });
          router.refresh();
        }}
      />
    </div>
  );
}

function AnnouncementEditor({
  state,
  onClose,
  onSaved,
}: {
  state: EditorState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = state.mode !== "closed";
  const editing = state.mode === "edit" ? state.announcement : null;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {open && (
          <EditorForm
            key={editing?.id ?? "new"}
            editing={editing}
            onSaved={onSaved}
            onClose={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function EditorForm({
  editing,
  onSaved,
  onClose,
}: {
  editing: AnnouncementDTO | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const bodyId = useId();
  const placeId = useId();
  const pinnedId = useId();
  const publishedId = useId();

  const [title, setTitle] = useState(editing?.title ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [category, setCategory] = useState<AnnouncementCategory>(
    editing?.category ?? AnnouncementCategory.ADVISORY,
  );
  const [place, setPlace] = useState(editing?.place ?? "");
  const [pinned, setPinned] = useState(editing?.pinned ?? false);
  const [published, setPublished] = useState(editing?.published ?? true);
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
      pinned,
      published,
    });
    setSaving(false);
    if (!result.ok) {
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
    onSaved();
  };

  const remove = async () => {
    if (!editing) return;
    setDeleting(true);
    const result = await deleteAnnouncement({ id: editing.id });
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Announcement deleted.");
    onClose();
    router.refresh();
  };

  return (
    <>
      <SheetHeader className="border-b border-border px-5 py-4">
        <SheetTitle>
          {editing ? "Edit announcement" : "New announcement"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Write a notice for residents.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor={titleId}>Title</Label>
            <Input
              id={titleId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Scheduled water interruption, June 28"
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
              rows={5}
              disabled={busy}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as AnnouncementCategory)}
                disabled={busy}
              >
                <SelectTrigger>
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
              <Label htmlFor={placeId}>Place</Label>
              <Input
                id={placeId}
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Barangay covered court"
                disabled={busy}
              />
            </div>
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

      <div className="flex items-center gap-2 border-t border-border px-5 py-4">
        {editing && (
          <Button
            variant="ghost"
            onClick={remove}
            disabled={busy}
            className="text-destructive hover:text-destructive"
          >
            {deleting ? <Spinner /> : <Trash2 />}
            Delete
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {saving && <Spinner />}
            {editing ? "Save changes" : published ? "Publish" : "Save draft"}
          </Button>
        </div>
      </div>
    </>
  );
}
