"use client";

import { useRef, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { Ban, Trash2 } from "lucide-react";
import {
  ResizeHandles,
  ALL_DIRS,
  X_DIRS,
  type Box,
} from "./resize-handles";
import { beginGuides, updateGuides, endGuides } from "./alignment-guides";

/**
 * A freely-placed vector shape — rectangle, ellipse, or line — the drawing
 * counterpart to the floating image/text. Like them, geometry is stored as
 * **percentages of the page** (`x`, `y`, `width`, `height`) so it reproduces
 * exactly at print on any paper size, plus fill/stroke styling. Placement is
 * custom pointer handling relative to the `.nx-doc` sheet.
 *
 * Serializes to a single `<div data-shape="…" style="position:absolute;…">`, so
 * the print view (which renders the stored HTML as-is) draws it with no extra
 * work. A line is a thin filled bar (`height` = stroke thickness in px).
 */

export type ShapeKind = "rect" | "ellipse" | "line";

interface ShapeAttrs {
  shape: ShapeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

const num = (value: string | null, fallback: number) => {
  const n = value ? parseFloat(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    floatingShape: {
      /** Insert a shape near the top-left of the page. */
      setFloatingShape: (attrs: { shape: ShapeKind }) => ReturnType;
    };
  }
}

/** The inline `style` for the stored/printed shape div. */
function shapeStyle(a: ShapeAttrs): string {
  const base = `position:absolute;left:${a.x}%;top:${a.y}%;width:${a.width}%;box-sizing:border-box;z-index:1;`;
  if (a.shape === "line") {
    return `${base}height:${a.strokeWidth}px;background:${a.stroke};`;
  }
  const radius = a.shape === "ellipse" ? "border-radius:50%;" : "";
  return `${base}height:${a.height}%;background:${a.fill};border:${a.strokeWidth}px solid ${a.stroke};${radius}`;
}

export const FloatingShape = Node.create({
  name: "floatingShape",
  group: "block",
  atom: true,
  draggable: false,
  selectable: true,

  addAttributes() {
    return {
      shape: { default: "rect" },
      x: { default: 12 },
      y: { default: 12 },
      width: { default: 25 },
      height: { default: 15 },
      fill: { default: "transparent" },
      stroke: { default: "#111111" },
      strokeWidth: { default: 2 },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-shape]",
        getAttrs: (el) => {
          const div = el as HTMLElement;
          const style = div.getAttribute("style") ?? "";
          const pick = (prop: string) =>
            style.match(new RegExp(`${prop}:\\s*(-?[\\d.]+)%`))?.[1] ?? null;
          return {
            shape: (div.getAttribute("data-shape") as ShapeKind) ?? "rect",
            x: num(pick("left"), 12),
            y: num(pick("top"), 12),
            width: num(pick("width"), 25),
            height: num(pick("height"), 15),
            fill: div.getAttribute("data-fill") ?? "transparent",
            stroke: div.getAttribute("data-stroke") ?? "#111111",
            strokeWidth: num(div.getAttribute("data-stroke-width"), 2),
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const a = node.attrs as ShapeAttrs;
    return [
      "div",
      mergeAttributes({
        "data-shape": a.shape,
        "data-fill": a.fill,
        "data-stroke": a.stroke,
        "data-stroke-width": String(a.strokeWidth),
        style: shapeStyle(a),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FloatingShapeView);
  },

  addCommands() {
    return {
      setFloatingShape:
        ({ shape }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              shape,
              x: 12,
              y: 12,
              width: shape === "line" ? 30 : 25,
              height: 15,
              fill: "transparent",
              stroke: "#111111",
              strokeWidth: 2,
            },
          }),
    };
  },
});

function FloatingShapeView({
  node,
  updateAttributes,
  selected,
  editor,
  getPos,
}: NodeViewProps) {
  const a = node.attrs as ShapeAttrs;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const editable = editor.isEditable;
  const isLine = a.shape === "line";

  const sheetRect = () =>
    wrapRef.current?.closest(".nx-doc")?.getBoundingClientRect() ?? null;

  const selectSelf = () => {
    const pos = getPos?.();
    if (typeof pos === "number") editor.commands.setNodeSelection(pos);
  };

  // Drag the shape anywhere on the page (updates x/y percentages).
  const startMove = (event: React.PointerEvent) => {
    if (!editable || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    selectSelf();
    const rect = sheetRect();
    if (!rect) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = a.x;
    const originY = a.y;
    const sheetEl = wrapRef.current?.closest<HTMLElement>(".nx-doc") ?? null;
    const session = beginGuides(sheetEl, wrapRef.current);
    setBusy(true);

    const onMove = (e: PointerEvent) => {
      const dx = ((e.clientX - startX) / rect.width) * 100;
      const dy = ((e.clientY - startY) / rect.height) * 100;
      const heightPct = wrapRef.current
        ? (wrapRef.current.offsetHeight / rect.height) * 100
        : 0;
      // Hold the shape's right/bottom edge on the page (top/left may bleed a
      // little) so it prints where it's placed instead of clipped off the sheet.
      const maxX = Math.max(-5, 100 - a.width);
      const maxY = Math.max(-5, 100 - heightPct);
      let nextX = clamp(originX + dx, -5, maxX);
      let nextY = clamp(originY + dy, -5, maxY);
      if (session) {
        ({ x: nextX, y: nextY } = updateGuides(session, {
          x: nextX,
          y: nextY,
          width: a.width,
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

  const inner: React.CSSProperties = isLine
    ? { width: "100%", height: a.strokeWidth, background: a.stroke }
    : {
        width: "100%",
        height: "100%",
        background: a.fill,
        border: `${a.strokeWidth}px solid ${a.stroke}`,
        borderRadius: a.shape === "ellipse" ? "50%" : undefined,
        boxSizing: "border-box",
      };

  return (
    <NodeViewWrapper
      ref={wrapRef}
      className="nx-float-shape"
      contentEditable={false}
      data-selected={selected || undefined}
      style={{
        position: "absolute",
        left: `${a.x}%`,
        top: `${a.y}%`,
        width: `${a.width}%`,
        height: isLine ? a.strokeWidth : `${a.height}%`,
        zIndex: selected ? 5 : 1,
        cursor: editable ? (busy ? "grabbing" : "grab") : "default",
      }}
    >
      <div onPointerDown={startMove} style={inner} />

      {/* A line is only a few px tall — give it a taller invisible grab band. */}
      {isLine && editable && (
        <div
          onPointerDown={startMove}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: -6,
            height: 12,
            cursor: busy ? "grabbing" : "grab",
          }}
        />
      )}

      {editable && selected && (
        <>
          <div className="nx-float-toolbar" contentEditable={false}>
            {!isLine && (
              <>
                <label className="nx-shape-swatch" title="Fill color">
                  <span style={{ background: a.fill }} />
                  <input
                    type="color"
                    aria-label="Fill color"
                    value={a.fill === "transparent" ? "#ffffff" : a.fill}
                    onChange={(e) => updateAttributes({ fill: e.target.value })}
                  />
                </label>
                <button
                  type="button"
                  className="nx-float-del !text-current"
                  aria-label="No fill"
                  title="No fill"
                  onClick={() => updateAttributes({ fill: "transparent" })}
                >
                  <Ban className="size-3.5" />
                </button>
              </>
            )}
            <label className="nx-shape-swatch" title="Border color">
              <span style={{ background: a.stroke }} />
              <input
                type="color"
                aria-label="Border color"
                value={a.stroke}
                onChange={(e) => updateAttributes({ stroke: e.target.value })}
              />
            </label>
            <button
              type="button"
              className="nx-float-del"
              aria-label="Delete shape"
              onClick={remove}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>

          <ResizeHandles
            dirs={isLine ? X_DIRS : ALL_DIRS}
            sheetRect={sheetRect}
            getBox={(): Box => ({
              x: a.x,
              y: a.y,
              width: a.width,
              height: a.height,
            })}
            onResize={(box) =>
              updateAttributes(
                isLine
                  ? { x: box.x, width: box.width }
                  : { x: box.x, y: box.y, width: box.width, height: box.height },
              )
            }
            onActive={setBusy}
          />
        </>
      )}
    </NodeViewWrapper>
  );
}
