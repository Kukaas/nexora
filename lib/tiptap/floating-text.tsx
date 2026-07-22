"use client";

import { useRef, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { GripVertical, Trash2 } from "lucide-react";
import { ResizeHandles, X_DIRS, type Box } from "./resize-handles";
import { beginGuides, updateGuides, endGuides } from "./alignment-guides";

/**
 * A freely-placed, editable text box — the building block of the document
 * canvas. Double-clicking an empty spot on the page drops one here (see the
 * designer's `handleDoubleClick`); you type rich text into it and drag/resize
 * it anywhere. Like the floating image, position and size are stored as
 * percentages of the page (`x`, `y`, `width`) so they reproduce exactly at
 * print on any paper size.
 *
 * Holds block content (`block+`) so headings, lists, tables, and merge fields
 * all work inside. Serializes to
 * `<div data-floating-text style="position:absolute;left:…%;top:…%;width:…%">`;
 * the sheet is `position: relative` (globals.css) so it anchors to the page.
 */

const num = (value: string | null, fallback: number) => {
  const n = value ? parseFloat(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const FloatingText = Node.create({
  name: "floatingText",
  group: "block",
  content: "block+",
  draggable: false,
  selectable: true,
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      x: { default: 10 },
      y: { default: 10 },
      width: { default: 35 },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-floating-text]",
        getAttrs: (el) => {
          const style = (el as HTMLElement).getAttribute("style") ?? "";
          const pick = (prop: string) =>
            style.match(new RegExp(`${prop}:\\s*(-?[\\d.]+)%`))?.[1] ?? null;
          return {
            x: num(pick("left"), 10),
            y: num(pick("top"), 10),
            width: num(pick("width"), 35),
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { x, y, width } = node.attrs;
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-floating-text": "",
        style: `position:absolute;left:${x}%;top:${y}%;width:${width}%;z-index:3;`,
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FloatingTextView);
  },

  addKeyboardShortcuts() {
    return {
      // Treat a text box as its own document: "select all" from inside a box
      // selects only that box's text, not the whole page. Outside a box it
      // falls through to the editor's default whole-document select-all.
      "Mod-a": () => {
        const { $from } = this.editor.state.selection;
        for (let depth = $from.depth; depth > 0; depth--) {
          if ($from.node(depth).type.name === this.name) {
            return this.editor.commands.setTextSelection({
              from: $from.start(depth),
              to: $from.end(depth),
            });
          }
        }
        return false;
      },
    };
  },
});

function FloatingTextView({
  node,
  updateAttributes,
  editor,
  getPos,
}: NodeViewProps) {
  const { x, y, width } = node.attrs as { x: number; y: number; width: number };
  const wrapRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const editable = editor.isEditable;

  const sheetRect = () =>
    wrapRef.current?.closest(".nx-doc")?.getBoundingClientRect() ?? null;

  const startMove = (event: React.PointerEvent) => {
    if (!editable || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = sheetRect();
    if (!rect) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = x;
    const originY = y;
    const sheetEl = wrapRef.current?.closest<HTMLElement>(".nx-doc") ?? null;
    const session = beginGuides(sheetEl, wrapRef.current);
    setBusy(true);

    const onMove = (e: PointerEvent) => {
      const dx = ((e.clientX - startX) / rect.width) * 100;
      const dy = ((e.clientY - startY) / rect.height) * 100;
      const heightPct = wrapRef.current
        ? (wrapRef.current.offsetHeight / rect.height) * 100
        : 0;
      // Hold the box's right/bottom edge on the page (top/left may bleed a little)
      // so it prints where it's placed instead of being clipped off the sheet.
      const maxX = Math.max(-5, 100 - width);
      const maxY = Math.max(-5, 100 - heightPct);
      let nextX = clamp(originX + dx, -5, maxX);
      let nextY = clamp(originY + dy, -5, maxY);
      if (session) {
        ({ x: nextX, y: nextY } = updateGuides(session, {
          x: nextX,
          y: nextY,
          width,
          height: heightPct,
        }));
        nextX = clamp(nextX, -5, maxX);
        nextY = clamp(nextY, -5, maxY);
      }
      updateAttributes({ x: nextX, y: nextY });
    };
    const onUp = () => {
      setBusy(false);
      endGuides(session);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const remove = () => {
    const pos = getPos?.();
    if (typeof pos !== "number") return;
    editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + node.nodeSize })
      .run();
  };

  return (
    <NodeViewWrapper
      ref={wrapRef}
      className="nx-float-text"
      data-busy={busy || undefined}
      style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: `${width}%` }}
    >
      {editable && (
        <div className="nx-float-toolbar" contentEditable={false}>
          <span
            role="presentation"
            aria-label="Move text box"
            className="nx-float-grip"
            onPointerDown={startMove}
          >
            <GripVertical className="size-3.5" />
          </span>
          <button
            type="button"
            aria-label="Delete text box"
            className="nx-float-del"
            onClick={remove}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}

      <NodeViewContent className="nx-float-text-content" />

      {editable && (
        <ResizeHandles
          dirs={X_DIRS}
          sheetRect={sheetRect}
          getBox={(): Box => ({ x, y, width, height: 0 })}
          onResize={(box) => updateAttributes({ x: box.x, width: box.width })}
          onActive={setBusy}
        />
      )}
    </NodeViewWrapper>
  );
}
