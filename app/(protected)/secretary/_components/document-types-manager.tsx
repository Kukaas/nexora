"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  deleteDocumentType,
  saveDocumentType,
  setDocumentTypeActive,
} from "@/lib/secretary-actions";
import { turnaroundLabel, type DocumentTypeDTO } from "@/lib/documents";
import { formatPeso } from "./secretary-ui";

type EditorState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; type: DocumentTypeDTO };

/** "No requests yet" / "1 request" / "12 requests". */
function requestCountLabel(count: number): string {
  if (count === 0) return "No requests yet";
  return `${count} request${count === 1 ? "" : "s"}`;
}

export function DocumentTypesManager({
  types,
}: {
  types: DocumentTypeDTO[];
}) {
  const router = useRouter();
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleActive = async (type: DocumentTypeDTO, active: boolean) => {
    setTogglingId(type.id);
    const result = await setDocumentTypeActive({ id: type.id, active });
    setTogglingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      active ? `${type.name} is now requestable.` : `${type.name} turned off.`,
    );
    router.refresh();
  };

  const activeCount = types.filter((t) => t.active).length;

  return (
    <div className="flex flex-col gap-5">
      {types.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">
              {types.length}
            </span>{" "}
            {types.length === 1 ? "document" : "documents"}
            <span className="px-1.5 text-muted-foreground/60" aria-hidden>
              ·
            </span>
            <span className="font-medium text-foreground tabular-nums">
              {activeCount}
            </span>{" "}
            available to residents
          </p>
          <Button onClick={() => setEditor({ mode: "create" })}>
            <Plus />
            Add document
          </Button>
        </div>
      )}

      {types.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>No documents yet</EmptyTitle>
            <EmptyDescription>
              Add the documents residents can request, like Barangay Clearance or
              Certificate of Indigency, and set a fee for each.
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => setEditor({ mode: "create" })}>
            <Plus />
            Add your first document
          </Button>
        </Empty>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card">
          {types.map((type) => (
            <li
              key={type.id}
              className={cn(
                "flex items-center gap-3 px-4 py-4 transition-colors sm:gap-4 sm:px-5",
                !type.active && "bg-muted/40",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span
                    className={cn(
                      "font-medium",
                      !type.active && "text-muted-foreground",
                    )}
                  >
                    {type.name}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-sm font-medium tabular-nums",
                      type.active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {type.fee > 0 ? formatPeso(type.fee) : "Free"}
                  </span>
                  {!type.active && <Badge variant="secondary">Off</Badge>}
                </div>
                {type.description && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    {type.description}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>{turnaroundLabel(type.turnaroundDays)}</span>
                  <span className="text-muted-foreground/50" aria-hidden>
                    ·
                  </span>
                  <span>{requestCountLabel(type.requestCount)}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <Switch
                  checked={type.active}
                  disabled={togglingId === type.id}
                  onCheckedChange={(v) => toggleActive(type, v)}
                  aria-label={`${type.active ? "Turn off" : "Turn on"} ${type.name}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditor({ mode: "edit", type })}
                  aria-label={`Edit ${type.name}`}
                >
                  <Pencil />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DocumentTypeEditor
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

function DocumentTypeEditor({
  state,
  onClose,
  onSaved,
}: {
  state: EditorState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = state.mode !== "closed";
  const editing = state.mode === "edit" ? state.type : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        {open && (
          <EditorForm
            key={editing?.id ?? "new"}
            editing={editing}
            onSaved={onSaved}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditorForm({
  editing,
  onSaved,
  onClose,
}: {
  editing: DocumentTypeDTO | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const nameId = useId();
  const descId = useId();
  const feeId = useId();
  const daysId = useId();
  const activeId = useId();

  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [fee, setFee] = useState(editing ? String(editing.fee) : "");
  const [days, setDays] = useState(String(editing?.turnaroundDays ?? 2));
  const [active, setActive] = useState(editing?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deletable = editing !== null && editing.requestCount === 0;
  const busy = saving || deleting;

  const save = async () => {
    if (!name.trim()) {
      toast.error("Give the document a name.");
      return;
    }
    const feeNum = Number(fee);
    if (!Number.isFinite(feeNum) || feeNum < 0) {
      toast.error("Enter a valid fee, like 50.");
      return;
    }
    setSaving(true);
    const result = await saveDocumentType({
      id: editing?.id,
      name: name.trim(),
      description: description.trim() || undefined,
      fee: feeNum,
      turnaroundDays: Number(days) || 0,
      active,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? "Document updated." : "Document added.");
    onSaved();
  };

  const remove = async () => {
    if (!editing) return;
    setDeleting(true);
    const result = await deleteDocumentType({ id: editing.id });
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Document deleted.");
    onClose();
    router.refresh();
  };

  return (
    <>
      <DialogHeader className="border-b border-border px-5 py-4 pr-14">
        <DialogTitle>{editing ? "Edit document" : "Add document"}</DialogTitle>
        <DialogDescription className="sr-only">
          Set the document name, fee, and turnaround.
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor={nameId}>Document name</Label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Barangay Clearance"
              disabled={busy}
              autoFocus={!editing}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={descId}>Description</Label>
            <Textarea
              id={descId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="For employment, permits, and IDs."
              rows={2}
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              Shown to residents so they pick the right document. Optional.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={feeId}>Fee</Label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
                  aria-hidden
                >
                  ₱
                </span>
                <Input
                  id={feeId}
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="50"
                  inputMode="decimal"
                  disabled={busy}
                  className="pl-7 font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use 0 for a free document.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={daysId}>Turnaround (days)</Label>
              <Input
                id={daysId}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="2"
                inputMode="numeric"
                disabled={busy}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Use 0 for same day.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-3xl border border-border px-4 py-3">
            <div>
              <Label htmlFor={activeId} className="text-sm font-medium">
                Available to request
              </Label>
              <p className="text-xs text-muted-foreground">
                Residents only see documents that are turned on.
              </p>
            </div>
            <Switch
              id={activeId}
              checked={active}
              onCheckedChange={setActive}
              disabled={busy}
            />
          </div>

          {editing && !deletable && (
            <p className="text-xs text-muted-foreground">
              {editing.requestCount} resident
              {editing.requestCount === 1 ? " has" : "s have"} requested this
              document, so it can&apos;t be deleted. Turn it off to stop new
              requests.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border px-5 py-4">
        {deletable && (
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
                <AlertDialogTitle>Delete this document?</AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="font-medium text-foreground">
                    {editing?.name}
                  </span>{" "}
                  will be removed from the catalog and residents won&apos;t be
                  able to request it. This can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>
                  Keep document
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={remove}
                  disabled={busy}
                >
                  Delete document
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {saving && <Spinner />}
            {editing ? "Save changes" : "Add document"}
          </Button>
        </div>
      </div>
    </>
  );
}
