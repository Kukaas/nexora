"use client";

import { useRef, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { Trash2 } from "lucide-react";
import QRCode from "react-qr-code";

import { ResizeHandles, X_DIRS, type Box } from "./resize-handles";
import { beginGuides, updateGuides, endGuides } from "./alignment-guides";

/**
 * The document's verification QR — a freely-placed box the secretary positions
 * on the layout. Like the other floating elements, position and width are stored
 * as **percentages of the page** (`x`, `y`, `width`) so it reproduces exactly at
 * print on any paper size; the QR is square, so height follows the width. It can
 * be dragged, resized, and deleted.
 *
 * It's optional and at most one per document: inserted from the toolbar (that
 * control disables once one exists) and removed like any floating element, since
 * some documents don't carry a QR.
 *
 * In the designer it shows a real (sample) QR so the secretary sees exactly what
 * prints. It serializes to an empty placeholder `<div data-floating-qr
 * style="position:absolute;left:…%;top:…%;width:…%">`; the print view reads those
 * coordinates and stamps the request's actual verification QR there.
 */

export interface FloatingQrAttrs {
  x: number;
  y: number;
  width: number;
}

// Stand-ins shown only in the designer. The real per-request code and reference
// number are filled in at print time — these just let the secretary see and
// place the mark with a realistic-looking sample.
const PREVIEW_VALUE = "https://verify.example/preview";
const PREVIEW_REFERENCE = "BRGY-0000-00000";

/** Default placement: lower-right of the page, a modest size. */
export const DEFAULT_QR_ATTRS: FloatingQrAttrs = { x: 74, y: 83, width: 16 };

/** Smallest width (% of the content box) the QR may be resized to. */
const QR_MIN_WIDTH = 8;
/** Below this width a QR gets unreliable to scan — warn the secretary. */
const QR_WARN_WIDTH = 12;
/** How far the QR may bleed past the page edges, so it can sit flush at any side. */
const QR_BLEED = 12;

const num = (value: string | null, fallback: number) => {
  const n = value ? parseFloat(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** The `style` for the stored placeholder the print view reads back. */
function placeholderStyle(a: FloatingQrAttrs): string {
  return `position:absolute;left:${a.x}%;top:${a.y}%;width:${a.width}%;z-index:3;`;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    floatingQr: {
      /** Insert the verification QR at its default position (used once per layout). */
      setFloatingQr: () => ReturnType;
    };
  }
}

export const FloatingQr = Node.create({
  name: "floatingQr",
  group: "block",
  atom: true,
  draggable: false,
  selectable: true,

  addAttributes() {
    return {
      x: { default: DEFAULT_QR_ATTRS.x },
      y: { default: DEFAULT_QR_ATTRS.y },
      width: { default: DEFAULT_QR_ATTRS.width },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-floating-qr]",
        getAttrs: (el) => {
          const style = (el as HTMLElement).getAttribute("style") ?? "";
          // `-?` is essential: a QR dragged to a top/left edge stores negative
          // percentages (e.g. left:-5%). Without it those fail to parse and the
          // QR snaps back to its default position on reload.
          const pick = (prop: string) =>
            style.match(new RegExp(`${prop}:\\s*(-?[\\d.]+)%`))?.[1] ?? null;
          return {
            x: num(pick("left"), DEFAULT_QR_ATTRS.x),
            y: num(pick("top"), DEFAULT_QR_ATTRS.y),
            width: num(pick("width"), DEFAULT_QR_ATTRS.width),
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const a = node.attrs as FloatingQrAttrs;
    return ["div", mergeAttributes({ "data-floating-qr": "", style: placeholderStyle(a) })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FloatingQrView);
  },

  addCommands() {
    return {
      setFloatingQr:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: DEFAULT_QR_ATTRS }),
    };
  },
});

function FloatingQrView({
  node,
  updateAttributes,
  selected,
  editor,
  getPos,
}: NodeViewProps) {
  const a = node.attrs as FloatingQrAttrs;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const editable = editor.isEditable;

  const sheetRect = () =>
    wrapRef.current?.closest(".nx-doc")?.getBoundingClientRect() ?? null;

  const selectSelf = () => {
    const pos = getPos?.();
    if (typeof pos === "number") editor.commands.setNodeSelection(pos);
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

  // Drag the QR anywhere on the page (updates x/y percentages).
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
      // Allow a generous bleed past every edge so the QR can be dropped right at
      // the very side/corner of the page, not just inside the text margin.
      const maxX = 100 - a.width + QR_BLEED;
      const maxY = 100 - heightPct + QR_BLEED;
      let nextX = clamp(originX + dx, -QR_BLEED, maxX);
      let nextY = clamp(originY + dy, -QR_BLEED, maxY);
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

  return (
    <NodeViewWrapper
      ref={wrapRef}
      className="nx-float-qr"
      contentEditable={false}
      data-selected={selected || undefined}
      // Drag from anywhere on the box. Putting the handler on the wrapper (not
      // the inner QR) means the react-qr-code <svg> can't swallow the
      // pointerdown — a press anywhere in the QR starts the move.
      onPointerDown={startMove}
      style={{
        position: "absolute",
        left: `${a.x}%`,
        top: `${a.y}%`,
        width: `${a.width}%`,
        zIndex: selected ? 6 : 3,
        cursor: editable ? (busy ? "grabbing" : "grab") : "default",
        outline: selected && editable ? "2px solid var(--primary)" : undefined,
      }}
    >
      <QrBlock value={PREVIEW_VALUE} reference={PREVIEW_REFERENCE} />

      {/* Warn (in the designer only) when the QR is shrunk past the point a
          phone camera can reliably read it. */}
      {editable && a.width < QR_WARN_WIDTH && (
        <div
          contentEditable={false}
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: 4,
            whiteSpace: "nowrap",
            padding: "2px 6px",
            borderRadius: 4,
            background: "#b45309",
            color: "#ffffff",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 10,
            fontWeight: 600,
            lineHeight: 1.2,
            pointerEvents: "none",
          }}
        >
          ⚠ Too small to scan reliably
        </div>
      )}

      {editable && selected && (
        <>
          <div
            className="nx-float-toolbar"
            contentEditable={false}
            // Don't let a click on the toolbar begin a drag on the wrapper.
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="nx-float-del"
              aria-label="Delete QR"
              onClick={remove}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>

          {/* Width-only resize keeps the QR square (its height follows the
              width). Floored at QR_MIN_WIDTH so it can't be shrunk to an
              unscannable size. */}
          <ResizeHandles
            dirs={X_DIRS}
            sheetRect={sheetRect}
            getBox={(): Box => ({ x: a.x, y: a.y, width: a.width, height: a.width })}
            onResize={(box, dir) => {
              let width = box.width;
              let x = box.x;
              if (width < QR_MIN_WIDTH) {
                width = QR_MIN_WIDTH;
                // On a left-edge drag, pin the right edge as it hits the floor.
                if (dir === "w") x = box.x + box.width - QR_MIN_WIDTH;
              }
              updateAttributes({ x, width });
            }}
            onActive={setBusy}
          />
        </>
      )}
    </NodeViewWrapper>
  );
}

/**
 * The visible QR mark — a white card with the square QR, a caption, and the
 * document's reference number. Shared shape between the designer preview and the
 * printed stamp so what the secretary places is what prints. `value` is the
 * sample URL in the designer and the request's real verify URL at print;
 * `reference` is the sample/real reference number shown under the QR.
 */
export function QrBlock({
  value,
  reference,
  onPointerDown,
}: {
  value: string;
  reference?: string;
  onPointerDown?: (event: React.PointerEvent) => void;
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        padding: 6,
        background: "#ffffff",
        border: "1px solid #d4d4d4",
        borderRadius: 6,
        color: "#111111",
        boxSizing: "border-box",
      }}
    >
      <QRCode
        value={value}
        level="M"
        size={256}
        style={{ width: "100%", height: "auto" }}
      />
      <span
        style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "0.6em",
          fontWeight: 700,
          lineHeight: 1.1,
          textAlign: "center",
        }}
      >
        Scan to verify
      </span>
      {reference && (
        <span
          style={{
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: "0.62em",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "0.02em",
            textAlign: "center",
            wordBreak: "break-all",
          }}
        >
          {reference}
        </span>
      )}
    </div>
  );
}
