"use client";

import { useRef, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";

/**
 * A freely-placed document image — Word "in front of text" style. The image is
 * positioned absolutely on the page and can be dragged to any spot and resized;
 * it floats over the text layer (it doesn't push or wrap text). Position and
 * size are stored as **percentages of the page** (`x`, `y`, `width`) so they
 * survive responsive scaling and reproduce exactly at print, whatever the paper
 * size. Placement is done with custom pointer handling relative to the `.nx-doc`
 * sheet, not ProseMirror's flow drag.
 *
 * Serializes to `<img data-floating style="position:absolute;left:…%;top:…%;
 * width:…%">`; the sheet is `position: relative` (globals.css) so the image
 * anchors to the page in both the editor and the print view.
 */

export interface FloatingImageAttrs {
  src: string;
  alt?: string;
  x: number;
  y: number;
  width: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    floatingImage: {
      /** Insert a floating image near the top-left of the page. */
      setFloatingImage: (attrs: { src: string; alt?: string }) => ReturnType;
    };
  }
}

const num = (value: string | null, fallback: number) => {
  const n = value ? parseFloat(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

export const FloatingImage = Node.create({
  name: "floatingImage",
  group: "block",
  atom: true,
  draggable: false,
  selectable: true,

  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: "" },
      x: { default: 8 },
      y: { default: 8 },
      width: { default: 30 },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[data-floating]",
        getAttrs: (el) => {
          const img = el as HTMLElement;
          const style = img.getAttribute("style") ?? "";
          const pick = (prop: string) =>
            style.match(new RegExp(`${prop}:\\s*([\\d.]+)%`))?.[1] ?? null;
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") ?? "",
            x: num(pick("left"), 8),
            y: num(pick("top"), 8),
            width: num(pick("width"), 30),
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { src, alt, x, y, width } = node.attrs;
    return [
      "img",
      mergeAttributes(HTMLAttributes, {
        "data-floating": "",
        src,
        alt,
        style: `position:absolute;left:${x}%;top:${y}%;width:${width}%;height:auto;`,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FloatingImageView);
  },

  addCommands() {
    return {
      setFloatingImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { ...attrs, x: 8, y: 8, width: 30 },
          }),
    };
  },
});

function FloatingImageView({
  node,
  updateAttributes,
  selected,
  editor,
  getPos,
}: NodeViewProps) {
  const { src, alt, x, y, width } = node.attrs as FloatingImageAttrs;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const editable = editor.isEditable;

  const sheetRect = () =>
    wrapRef.current?.closest(".nx-doc")?.getBoundingClientRect() ?? null;

  const selectSelf = () => {
    const pos = getPos?.();
    if (typeof pos === "number") editor.commands.setNodeSelection(pos);
  };

  // Drag the whole image to any spot on the page (updates x/y percentages).
  const startMove = (event: React.PointerEvent) => {
    if (!editable) return;
    event.preventDefault();
    event.stopPropagation();
    selectSelf();
    const rect = sheetRect();
    if (!rect) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = x;
    const originY = y;
    setBusy(true);

    const onMove = (e: PointerEvent) => {
      const dx = ((e.clientX - startX) / rect.width) * 100;
      const dy = ((e.clientY - startY) / rect.height) * 100;
      updateAttributes({
        x: clamp(originX + dx, -5, 100),
        y: clamp(originY + dy, -5, 100),
      });
    };
    const onUp = () => {
      setBusy(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // Resize from the corner (updates width percentage; height stays proportional).
  const startResize = (event: React.PointerEvent) => {
    if (!editable) return;
    event.preventDefault();
    event.stopPropagation();
    selectSelf();
    const rect = sheetRect();
    if (!rect) return;
    const startX = event.clientX;
    const originW = width;
    setBusy(true);

    const onMove = (e: PointerEvent) => {
      const dw = ((e.clientX - startX) / rect.width) * 100;
      updateAttributes({ width: clamp(originW + dw, 5, 100) });
    };
    const onUp = () => {
      setBusy(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <NodeViewWrapper
      ref={wrapRef}
      className="nx-float-image"
      contentEditable={false}
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        zIndex: selected ? 3 : 2,
        cursor: editable ? (busy ? "grabbing" : "grab") : "default",
        outline:
          selected && editable ? "2px solid var(--primary)" : "1px dashed transparent",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? ""}
        draggable={false}
        onPointerDown={startMove}
        style={{ display: "block", width: "100%", height: "auto" }}
      />
      {editable && selected && (
        <span
          role="presentation"
          onPointerDown={startResize}
          style={{
            position: "absolute",
            right: -7,
            bottom: -7,
            width: 15,
            height: 15,
            borderRadius: 4,
            border: "2px solid var(--primary)",
            background: "var(--background)",
            cursor: "nwse-resize",
          }}
        />
      )}
    </NodeViewWrapper>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
