"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-end">
        <Button onClick={() => setEditor({ mode: "create" })}>
          <Plus />
          Add document
        </Button>
      </div>

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
              className="flex items-center gap-4 px-4 py-4 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="font-medium">{type.name}</span>
                  <span className="font-mono text-sm font-medium tabular-nums text-foreground">
                    {formatPeso(type.fee)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {turnaroundLabel(type.turnaroundDays)}
                  </span>
                </div>
                {type.description && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    {type.description}
                  </p>
                )}
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
      <SheetHeader className="border-b border-border px-5 py-4">
        <SheetTitle>{editing ? "Edit document" : "Add document"}</SheetTitle>
        <SheetDescription className="sr-only">
          Set the document name, fee, and turnaround.
        </SheetDescription>
      </SheetHeader>

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
              <Label htmlFor={feeId}>Fee (₱)</Label>
              <Input
                id={feeId}
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="50"
                inputMode="decimal"
                disabled={busy}
                className="font-mono"
              />
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
            {editing ? "Save changes" : "Add document"}
          </Button>
        </div>
      </div>
    </>
  );
}
