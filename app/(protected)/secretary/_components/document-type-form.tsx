"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  ListPlus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
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
import { deleteDocumentType, saveDocumentType } from "@/lib/secretary-actions";
import {
  DOCUMENT_FIELD_TYPE_LABELS,
  DOCUMENT_FIELD_TYPES,
  type DocumentField,
  type DocumentFieldType,
  type DocumentTypeDTO,
} from "@/lib/documents";

/**
 * The secretary's add/edit document form, rendered full-width as its own page
 * (the catalog links here rather than opening a dialog). `editing` is null in
 * create mode. On success it returns to `backHref` — the document catalog.
 */
export function DocumentTypeForm({
  editing,
  backHref,
}: {
  editing: DocumentTypeDTO | null;
  backHref: string;
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
  const [fields, setFields] = useState<DocumentField[]>(
    () => editing?.fields ?? [],
  );
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
    // Every field needs a label, and every dropdown needs at least one choice.
    for (const field of fields) {
      if (!field.label.trim()) {
        toast.error("Give every field a label, or remove the empty one.");
        return;
      }
      if (
        field.type === "select" &&
        field.options.filter((o) => o.trim()).length === 0
      ) {
        toast.error(`Add at least one choice to the "${field.label}" dropdown.`);
        return;
      }
    }
    setSaving(true);
    const result = await saveDocumentType({
      id: editing?.id,
      name: name.trim(),
      description: description.trim() || undefined,
      fee: feeNum,
      turnaroundDays: Number(days) || 0,
      active,
      fields: fields.map((field) => ({
        id: field.id,
        label: field.label.trim(),
        type: field.type,
        required: field.required,
        options:
          field.type === "select"
            ? field.options.map((o) => o.trim()).filter(Boolean)
            : [],
      })),
    });
    if (!result.ok) {
      setSaving(false);
      toast.error(result.error);
      return;
    }
    // After adding a new document, send the secretary straight into the layout
    // designer; on edit, return to the catalog as before.
    if (editing) {
      toast.success("Document updated.");
      router.push(backHref);
    } else {
      toast.success("Document added. Now design its printed layout.");
      router.push(`${backHref}/${result.id}/design`);
    }
    router.refresh();
  };

  const remove = async () => {
    if (!editing) return;
    setDeleting(true);
    const result = await deleteDocumentType({ id: editing.id });
    if (!result.ok) {
      setDeleting(false);
      toast.error(result.error);
      return;
    }
    toast.success("Document deleted.");
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
        Document catalog
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {editing ? "Edit document" : "Add document"}
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground text-pretty">
          Set the document name, fee, and turnaround, then add the details
          residents fill in when they request it.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* The basics */}
        <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6">
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
        </div>

        {/* The custom fields residents fill in */}
        <div className="rounded-4xl border border-border bg-card p-5 sm:p-6">
          <FieldsEditor fields={fields} onChange={setFields} disabled={busy} />
        </div>
      </div>

      {editing && !deletable && (
        <p className="text-xs text-muted-foreground">
          {editing.requestCount} resident
          {editing.requestCount === 1 ? " has" : "s have"} requested this
          document, so it can&apos;t be deleted. Turn it off to stop new
          requests.
        </p>
      )}

      <div className="flex items-center gap-2">
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
          {editing && (
            <Button variant="outline" asChild disabled={busy}>
              <Link href={`${backHref}/${editing.id}/design`}>
                <FileText />
                Design layout
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild disabled={busy}>
            <Link href={backHref}>Cancel</Link>
          </Button>
          <Button onClick={save} disabled={busy}>
            {saving && <Spinner />}
            {editing ? "Save changes" : "Add document"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** A blank custom field, defaulting to a short-text input. */
function newField(): DocumentField {
  return {
    id: crypto.randomUUID(),
    label: "",
    type: "text",
    required: true,
    options: [],
  };
}

/**
 * The builder for a document's custom fields: the secretary adds the inputs
 * residents fill in (e.g. Full name, Birth date), picks each field's type, marks
 * it required or optional, and lists the choices for any dropdown. Fields keep
 * their order, which is the order residents see them in.
 */
function FieldsEditor({
  fields,
  onChange,
  disabled,
}: {
  fields: DocumentField[];
  onChange: (next: DocumentField[]) => void;
  disabled: boolean;
}) {
  const patch = (id: string, changes: Partial<DocumentField>) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, ...changes } : f)));

  const remove = (id: string) => onChange(fields.filter((f) => f.id !== id));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label className="text-sm font-medium">Fields residents fill in</Label>
        <p className="text-xs text-muted-foreground">
          Add the details to collect when someone requests this document, like
          Full name or Birth date. Leave empty to just collect the basics.
        </p>
      </div>

      {fields.length > 0 && (
        <ul className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <li
              key={field.id}
              className="flex flex-col gap-3 rounded-3xl border border-border bg-muted/30 p-3.5"
            >
              <div className="flex items-start gap-2">
                <Input
                  value={field.label}
                  onChange={(e) => patch(field.id, { label: e.target.value })}
                  placeholder="Field label, e.g. Full name"
                  disabled={disabled}
                  className="flex-1 bg-background"
                  aria-label={`Field ${index + 1} label`}
                />
                <div className="flex shrink-0 flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={disabled || index === 0}
                    onClick={() => move(index, -1)}
                    aria-label="Move field up"
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={disabled || index === fields.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="Move field down"
                  >
                    <ChevronDown />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={disabled}
                  onClick={() => remove(field.id)}
                  aria-label={`Remove ${field.label || "field"}`}
                >
                  <Trash2 />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={field.type}
                  onValueChange={(value) =>
                    patch(field.id, { type: value as DocumentFieldType })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger size="sm" className="w-36 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_FIELD_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {DOCUMENT_FIELD_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Switch
                    checked={field.required}
                    onCheckedChange={(v) => patch(field.id, { required: v })}
                    disabled={disabled}
                    aria-label="Required field"
                  />
                  Required
                </label>
              </div>

              {field.type === "select" && (
                <OptionsEditor
                  options={field.options}
                  onChange={(options) => patch(field.id, { options })}
                  disabled={disabled}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={disabled}
        onClick={() => onChange([...fields, newField()])}
      >
        <Plus />
        Add field
      </Button>
    </div>
  );
}

/** The list of choices for a single dropdown field. */
function OptionsEditor({
  options,
  onChange,
  disabled,
}: {
  options: string[];
  onChange: (next: string[]) => void;
  disabled: boolean;
}) {
  const list = options.length > 0 ? options : [""];

  const setAt = (index: number, value: string) =>
    onChange(list.map((o, i) => (i === index ? value : o)));

  const removeAt = (index: number) =>
    onChange(list.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-border bg-background/60 p-3">
      <p className="text-xs font-medium text-muted-foreground">Choices</p>
      {list.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={option}
            onChange={(e) => setAt(index, e.target.value)}
            placeholder={`Choice ${index + 1}`}
            disabled={disabled}
            className="h-8 flex-1 bg-background"
            aria-label={`Choice ${index + 1}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            disabled={disabled || list.length === 1}
            onClick={() => removeAt(index)}
            aria-label={`Remove choice ${index + 1}`}
          >
            <X />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start text-muted-foreground"
        disabled={disabled}
        onClick={() => onChange([...list, ""])}
      >
        <ListPlus />
        Add choice
      </Button>
    </div>
  );
}
