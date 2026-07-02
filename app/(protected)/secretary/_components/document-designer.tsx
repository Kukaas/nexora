"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useEditor,
  useEditorState,
  EditorContent,
  type Editor,
} from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import {
  TextStyle,
  FontFamily,
  FontSize,
  LineHeight,
  Color,
} from "@tiptap/extension-text-style";
import { TextAlign } from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";
import { TextSelection } from "@tiptap/pm/state";
import {
  ArrowLeft,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignVerticalSpaceAround,
  AlignHorizontalSpaceAround,
  Baseline,
  Bold,
  Braces,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { saveDocumentTemplate } from "@/lib/secretary-actions";
import {
  MERGE_SYSTEM_TOKENS,
  ORIENTATIONS,
  PAPER_SIZES,
  paperLayout,
  paperSizeOf,
  type DocumentTypeDTO,
  type MediaAssetDTO,
  type Orientation,
  type PaperSize,
} from "@/lib/documents";
import { MergeField } from "@/lib/tiptap/merge-field";
import { LetterSpacing } from "@/lib/tiptap/letter-spacing";
import { FloatingImage } from "@/lib/tiptap/floating-image";
import { FloatingText } from "@/lib/tiptap/floating-text";
import { ImageLibraryDialog } from "./image-library-dialog";

/** Font stacks offered in the toolbar. Values are real CSS stacks so the print
 * output (which uses system fonts) matches what the secretary sees. */
const FONT_FAMILIES = [
  { label: "Default", value: "default" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
];

const FONT_SIZES = ["10", "11", "12", "14", "16", "18", "24", "32", "48"];

/** Line spacing (unitless multiplier of the font size, Word-style). */
const LINE_HEIGHTS = [
  { label: "Single", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "Double", value: "2" },
  { label: "2.5", value: "2.5" },
];

/** Letter spacing (tracking) offered in the toolbar, as CSS lengths. */
const LETTER_SPACINGS = [
  { label: "Tight", value: "-0.5px" },
  { label: "0.5px", value: "0.5px" },
  { label: "1px", value: "1px" },
  { label: "2px", value: "2px" },
  { label: "4px", value: "4px" },
];

/**
 * The full-width "Design document" editor: a Word-like Tiptap surface where the
 * secretary lays out the printed document (letterhead, body text, tables,
 * images) and drops in merge-field placeholders for the resident's answers and
 * system tokens. Saves the layout as HTML via saveDocumentTemplate.
 */
export function DocumentDesigner({
  documentType,
  mediaAssets,
  backHref,
}: {
  documentType: DocumentTypeDTO;
  mediaAssets: MediaAssetDTO[];
  backHref: string;
}) {
  const [saving, setSaving] = useState(false);
  const [paperSize, setPaperSize] = useState<PaperSize>(
    () => paperSizeOf(documentType.paperSize).value,
  );
  const [orientation, setOrientation] = useState<Orientation>(() =>
    documentType.orientation === "landscape" ? "landscape" : "portrait",
  );

  const layout = paperLayout(paperSize, orientation);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // A bold drop cursor so it's obvious where a dragged image will land.
        dropcursor: { color: "var(--primary)", width: 3 },
      }),
      TextStyle,
      FontFamily,
      FontSize,
      LineHeight,
      LetterSpacing,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit.configure({ table: { resizable: true } }),
      FloatingImage,
      FloatingText,
      MergeField,
    ],
    content: documentType.template ?? "<p></p>",
    editorProps: {
      attributes: { class: "nx-doc-editor focus:outline-none" },
    },
  });

  const save = async () => {
    if (!editor) return;
    setSaving(true);
    const result = await saveDocumentTemplate({
      id: documentType.id,
      template: editor.getHTML(),
      paperSize,
      orientation,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Layout saved.");
  };

  const addTextBox = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!editor) return;

    const target = event.target as HTMLElement;
    if (target.closest(".nx-float-text, .nx-float-image, img, td, th")) return;

    // Preserve the browser's normal double-click-to-select-word behavior. A
    // collapsed selection means the pointer landed on blank document space,
    // even when that space is inside a full-width paragraph element.
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim()) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 92);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 98);
    const width = Math.min(35, 100 - x);

    event.preventDefault();

    const insertPos = editor.state.doc.content.size;
    const paragraph = editor.schema.nodes.paragraph.create();
    const textBox = editor.schema.nodes.floatingText.create(
      { x, y, width },
      paragraph,
    );
    const transaction = editor.state.tr.insert(insertPos, textBox);

    // A floatingText starts at insertPos; +1 enters the node and +2 enters its
    // first paragraph. Placing the text selection there makes the next keypress
    // appear at the exact point that was double-clicked.
    transaction.setSelection(TextSelection.create(transaction.doc, insertPos + 2));
    editor.view.dispatch(transaction.scrollIntoView());
    editor.view.focus();
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

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Design {documentType.name}
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">
            Lay out the printed document — letterhead, body, tables, and images.
            Use <span className="font-medium text-foreground">Insert field</span>{" "}
            to drop in a resident&apos;s answer or a system value; it&apos;s
            filled in per request when you print.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Paper
            <Select
              value={paperSize}
              onValueChange={(v) => setPaperSize(v as PaperSize)}
            >
              <SelectTrigger size="sm" className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAPER_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Layout
            <Select
              value={orientation}
              onValueChange={(v) => setOrientation(v as Orientation)}
            >
              <SelectTrigger size="sm" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORIENTATIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Button onClick={save} disabled={!editor || saving}>
            {saving && <Spinner />}
            Save layout
          </Button>
        </div>
      </header>

      <div className="overflow-hidden rounded-4xl border border-border bg-card">
        {editor && (
          <Toolbar
            editor={editor}
            fields={documentType.fields}
            mediaAssets={mediaAssets}
          />
        )}
        <div className="max-h-[70vh] overflow-auto bg-muted/40 p-4 sm:p-8">
          <p className="mx-auto mb-3 max-w-fit text-xs text-muted-foreground">
            Double-click a blank spot on the paper to add text there.
          </p>
          {/* The sheet mirrors the printed page at the chosen paper size. */}
          <div
            className="nx-doc mx-auto"
            onDoubleClick={addTextBox}
            style={{
              width: `min(${layout.width}, 100%)`,
              // Drives the editor's min-height so the sheet reads as a real page.
              ["--nx-page-h" as string]: layout.height,
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** The formatting toolbar. Buttons reflect the current selection's marks. */
function Toolbar({
  editor,
  fields,
  mediaAssets,
}: {
  editor: Editor;
  fields: DocumentTypeDTO["fields"];
  mediaAssets: MediaAssetDTO[];
}) {
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      const textStyle = currentEditor.getAttributes("textStyle");
      const textAlign = (["left", "center", "right", "justify"] as const).find(
        (align) => currentEditor.isActive({ textAlign: align }),
      );

      return {
        currentFont:
          FONT_FAMILIES.find((font) => font.value === textStyle.fontFamily)
            ?.value ?? "default",
        currentSize: String(textStyle.fontSize ?? "").replace("px", ""),
        currentLineHeight: String(textStyle.lineHeight ?? ""),
        currentLetterSpacing: String(textStyle.letterSpacing ?? ""),
        textColor: textStyle.color ?? "#000000",
        blockValue: currentEditor.isActive("heading", { level: 1 })
          ? "h1"
          : currentEditor.isActive("heading", { level: 2 })
            ? "h2"
            : currentEditor.isActive("heading", { level: 3 })
              ? "h3"
              : "p",
        bold: currentEditor.isActive("bold"),
        italic: currentEditor.isActive("italic"),
        underline: currentEditor.isActive("underline"),
        strike: currentEditor.isActive("strike"),
        textAlign: textAlign ?? "left",
        bulletList: currentEditor.isActive("bulletList"),
        orderedList: currentEditor.isActive("orderedList"),
        inTable: currentEditor.isActive("table"),
        canUndo: currentEditor.can().undo(),
        canRedo: currentEditor.can().redo(),
      };
    },
  });

  const applyAlign = (align: "left" | "center" | "right" | "justify") => {
    editor.chain().focus().setTextAlign(align).run();
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-1 gap-y-1.5 border-b border-border bg-card/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {/* History */}
      <Group>
        <ToolButton
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!toolbarState.canUndo}
        >
          <Undo2 />
        </ToolButton>
        <ToolButton
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!toolbarState.canRedo}
        >
          <Redo2 />
        </ToolButton>
      </Group>

      <Bar />

      {/* Block type + fonts */}
      <Group>
        <Select
          value={toolbarState.blockValue}
          onValueChange={(v) => {
            const c = editor.chain().focus();
            if (v === "p") c.setParagraph().run();
            else c.toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run();
          }}
        >
          <SelectTrigger size="sm" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p">
              <Pilcrow className="size-3.5" /> Body
            </SelectItem>
            <SelectItem value="h1">
              <Heading1 className="size-3.5" /> Heading 1
            </SelectItem>
            <SelectItem value="h2">
              <Heading2 className="size-3.5" /> Heading 2
            </SelectItem>
            <SelectItem value="h3">
              <Heading3 className="size-3.5" /> Heading 3
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={toolbarState.currentFont}
          onValueChange={(v) => {
            if (v === "default") editor.chain().focus().unsetFontFamily().run();
            else editor.chain().focus().setFontFamily(v).run();
          }}
        >
          <SelectTrigger size="sm" className="w-32 lg:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={toolbarState.currentSize || "unset"}
          onValueChange={(v) => {
            if (v === "unset") editor.chain().focus().unsetFontSize().run();
            else editor.chain().focus().setFontSize(`${v}px`).run();
          }}
        >
          <SelectTrigger size="sm" className="w-20">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unset">Auto</SelectItem>
            {FONT_SIZES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Group>

      <Bar />

      {/* Spacing */}
      <Group>
        <SpacingMenu
          label="Line spacing"
          icon={<AlignVerticalSpaceAround className="size-4" />}
          value={toolbarState.currentLineHeight}
          options={LINE_HEIGHTS}
          onSelect={(v) => {
            const c = editor.chain().focus();
            if (v === null) c.unsetLineHeight().run();
            else c.setLineHeight(v).run();
          }}
        />
        <SpacingMenu
          label="Letter spacing"
          icon={<AlignHorizontalSpaceAround className="size-4" />}
          value={toolbarState.currentLetterSpacing}
          options={LETTER_SPACINGS}
          onSelect={(v) => {
            const c = editor.chain().focus();
            if (v === null) c.unsetLetterSpacing().run();
            else c.setLetterSpacing(v).run();
          }}
        />
      </Group>

      <Bar />

      {/* Marks */}
      <Group>
        <ToolButton
          label="Bold"
          active={toolbarState.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold />
        </ToolButton>
        <ToolButton
          label="Italic"
          active={toolbarState.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </ToolButton>
        <ToolButton
          label="Underline"
          active={toolbarState.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline />
        </ToolButton>
        <ToolButton
          label="Strikethrough"
          active={toolbarState.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough />
        </ToolButton>

        {/* Text color */}
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="relative inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <Baseline className="size-4" />
              <input
                type="color"
                aria-label="Text color"
                className="absolute inset-0 cursor-pointer opacity-0"
                value={toolbarState.textColor}
                onChange={(e) =>
                  editor.chain().focus().setColor(e.target.value).run()
                }
              />
            </label>
          </TooltipTrigger>
          <TooltipContent>Text color</TooltipContent>
        </Tooltip>
      </Group>

      <Bar />

      {/* Alignment */}
      <Group>
        <ToolButton
          label="Align left"
          active={toolbarState.textAlign === "left"}
          onClick={() => applyAlign("left")}
        >
          <AlignLeft />
        </ToolButton>
        <ToolButton
          label="Align center"
          active={toolbarState.textAlign === "center"}
          onClick={() => applyAlign("center")}
        >
          <AlignCenter />
        </ToolButton>
        <ToolButton
          label="Align right"
          active={toolbarState.textAlign === "right"}
          onClick={() => applyAlign("right")}
        >
          <AlignRight />
        </ToolButton>
        <ToolButton
          label="Justify"
          active={toolbarState.textAlign === "justify"}
          onClick={() => applyAlign("justify")}
        >
          <AlignJustify />
        </ToolButton>
      </Group>

      <Bar />

      {/* Lists */}
      <Group>
        <ToolButton
          label="Bullet list"
          active={toolbarState.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List />
        </ToolButton>
        <ToolButton
          label="Numbered list"
          active={toolbarState.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </ToolButton>
      </Group>

      <Bar />

      {/* Insert: tables, images, merge fields */}
      <Group>
        <TableMenu editor={editor} inTable={toolbarState.inTable} />
        <ImageLibraryDialog editor={editor} initialAssets={mediaAssets} />
      </Group>

      {/* Insert field: right-aligned on wide screens, wraps on narrow ones. */}
      <div className="ml-auto">
        <InsertFieldMenu editor={editor} fields={fields} />
      </div>
    </div>
  );
}

/** A cluster of related toolbar controls that stays together when the toolbar
 * wraps, so buttons never split awkwardly across rows. */
function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

/** A compact icon dropdown for line/letter spacing — icon + current value +
 * chevron, with a radio list of presets. Keeps the toolbar narrow (a full
 * `Select` per control was too wide) and consistent with the Table menu. */
function SpacingMenu({
  label,
  icon,
  value,
  options,
  onSelect,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string | null) => void;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 px-2"
              aria-label={label}
            >
              {icon}
              {current && (
                <span className="text-xs tabular-nums">{current.label}</span>
              )}
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value || "default"}
          onValueChange={(v) => onSelect(v === "default" ? null : v)}
        >
          <DropdownMenuRadioItem value="default">Default</DropdownMenuRadioItem>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TableMenu({
  editor,
  inTable,
}: {
  editor: Editor;
  inTable: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <TableIcon className="size-4" />
          Table
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          Insert 3×3 table
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!inTable}
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        >
          Add column
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!inTable}
          onClick={() => editor.chain().focus().deleteColumn().run()}
        >
          Delete column
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!inTable}
          onClick={() => editor.chain().focus().addRowAfter().run()}
        >
          Add row
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!inTable}
          onClick={() => editor.chain().focus().deleteRow().run()}
        >
          Delete row
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!inTable}
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        >
          Toggle header row
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={!inTable}
          onClick={() => editor.chain().focus().deleteTable().run()}
        >
          Delete table
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function InsertFieldMenu({
  editor,
  fields,
}: {
  editor: Editor;
  fields: DocumentTypeDTO["fields"];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className="ml-auto gap-1">
          <Braces className="size-4" />
          Insert field
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-auto">
        <DropdownMenuLabel>This document&apos;s fields</DropdownMenuLabel>
        {fields.length === 0 && (
          <DropdownMenuItem disabled>No custom fields yet</DropdownMenuItem>
        )}
        {fields.map((field) => (
          <DropdownMenuItem
            key={field.id}
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertMergeField({
                  kind: "field",
                  key: field.label,
                  label: field.label,
                })
                .run()
            }
          >
            {field.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>System values</DropdownMenuLabel>
        {MERGE_SYSTEM_TOKENS.map((token) => (
          <DropdownMenuItem
            key={token.key}
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertMergeField({
                  kind: "system",
                  key: token.key,
                  label: token.label,
                })
                .run()
            }
          >
            {token.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={active ? "secondary" : "ghost"}
          size="icon"
          className="size-8"
          disabled={disabled}
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function Bar() {
  return <Separator orientation="vertical" className="mx-1 !h-6" />;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
