"use client";

import { useRef, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { toast } from "sonner";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { uploadTemplateImage } from "@/lib/secretary-actions";
import {
  ResizeHandles,
  ALL_DIRS,
  type Box,
  type ResizeDir,
} from "./resize-handles";
import { beginGuides, updateGuides, endGuides } from "./alignment-guides";

/**
 * A freely-placed document image — Word "in front of text" style. Position and
 * size are stored as **percentages of the page** (`x`, `y`, `width`, and an
 * optional explicit `height`; null = keep aspect) so it reproduces exactly at
 * print on any paper size. It can be dragged anywhere, resized from any edge or
 * corner (corners keep aspect, sides stretch), and right-clicked for a context
 * menu (replace, alt text, opacity/visibility, stacking order, reset, delete).
 *
 * Serializes to `<img data-floating style="position:absolute;left:…%;top:…%;
 * width:…%;height:…;opacity:…;z-index:…">`; the sheet is `position: relative`
 * (globals.css) so it anchors to the page in both editor and print.
 */

export interface FloatingImageAttrs {
  src: string;
  alt?: string;
  x: number;
  y: number;
  width: number;
  height: number | null;
  opacity: number;
  z: number | null;
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

const percentOrNull = (style: string, prop: string): number | null => {
  // `-?` so an element dragged to a top/left edge (negative %) parses back
  // instead of snapping to its default position on reload.
  const m = style.match(new RegExp(`${prop}:\\s*(-?[\\d.]+)%`));
  return m ? parseFloat(m[1]) : null;
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
      height: { default: null },
      opacity: { default: 1 },
      z: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[data-floating]",
        getAttrs: (el) => {
          const img = el as HTMLElement;
          const style = img.getAttribute("style") ?? "";
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") ?? "",
            x: percentOrNull(style, "left") ?? 8,
            y: percentOrNull(style, "top") ?? 8,
            width: percentOrNull(style, "width") ?? 30,
            height: percentOrNull(style, "height"),
            opacity: num(style.match(/opacity:\s*([\d.]+)/)?.[1] ?? null, 1),
            z: style.match(/z-index:\s*(\d+)/)
              ? Number(style.match(/z-index:\s*(\d+)/)![1])
              : null,
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { src, alt, x, y, width, height, opacity, z } =
      node.attrs as FloatingImageAttrs;
    return [
      "img",
      mergeAttributes(HTMLAttributes, {
        "data-floating": "",
        src,
        alt,
        style:
          `position:absolute;left:${x}%;top:${y}%;width:${width}%;` +
          `height:${height != null ? `${height}%` : "auto"};` +
          `opacity:${opacity};z-index:${z ?? 2};`,
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
  const { src, alt, x, y, width, height, opacity, z } =
    node.attrs as FloatingImageAttrs;
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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
    if (!editable || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    selectSelf();
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
      // Hold the image's right/bottom edge on the page (top/left may bleed a
      // little) so it prints where it's placed instead of clipped off the sheet.
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

  // Current on-screen height as a % of the page, for edge resizing.
  const getBox = (): Box => {
    const rect = sheetRect();
    const el = wrapRef.current;
    const h =
      rect && el ? (el.offsetHeight / rect.height) * 100 : (height ?? 0);
    return { x, y, width, height: h };
  };

  const onResize = (box: Box, dir: ResizeDir) => {
    if (dir === "n" || dir === "s") {
      // Vertical edge: stretch height only.
      updateAttributes({ y: box.y, height: box.height });
    } else if (dir === "e" || dir === "w") {
      // Horizontal edge: stretch width only.
      updateAttributes({ x: box.x, width: box.width });
    } else {
      // Corner: keep aspect ratio (width drives, height back to auto).
      updateAttributes({ x: box.x, width: box.width, height: null });
    }
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

  const editAlt = () => {
    const next = window.prompt("Alternative text for this image", alt ?? "");
    if (next !== null) updateAttributes({ alt: next });
  };

  const onReplaceFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    const result = await uploadTemplateImage(form);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    updateAttributes({ src: result.asset.url, alt: result.asset.name });
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
        // Keep the explicit height on the absolutely-positioned wrapper (not the
        // inner img). A percentage height on an in-flow img resolves against its
        // auto-height parent and collapses to `auto`; on this abs box it resolves
        // against the page — matching the printed `position:absolute` <img>.
        height: height != null ? `${height}%` : undefined,
        opacity,
        zIndex: selected ? 6 : (z ?? 2),
        cursor: editable ? (busy ? "grabbing" : "grab") : "default",
        outline:
          selected && editable ? "2px solid var(--primary)" : undefined,
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild disabled={!editable}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt ?? ""}
            draggable={false}
            onPointerDown={startMove}
            style={{
              display: "block",
              width: "100%",
              // Fill the wrapper, which carries the real page-relative height.
              height: height != null ? "100%" : "auto",
            }}
          />
        </ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <ContextMenuItem onSelect={() => fileRef.current?.click()}>
            Replace image…
          </ContextMenuItem>
          <ContextMenuItem onSelect={editAlt}>Edit alt text…</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuLabel>Visibility</ContextMenuLabel>
          <ContextMenuRadioGroup
            value={String(opacity)}
            onValueChange={(v) => updateAttributes({ opacity: Number(v) })}
          >
            <ContextMenuRadioItem value="1">Opaque (100%)</ContextMenuRadioItem>
            <ContextMenuRadioItem value="0.75">75%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="0.5">50%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="0.25">25%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="0">Hidden</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={() => updateAttributes({ z: 50 })}>
            Bring to front
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => updateAttributes({ z: 0 })}>
            Send to back
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => updateAttributes({ width: 30, height: null })}
          >
            Reset size
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onSelect={remove}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {editable && selected && (
        <ResizeHandles
          dirs={ALL_DIRS}
          sheetRect={sheetRect}
          getBox={getBox}
          onResize={onResize}
          onActive={setBusy}
        />
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onReplaceFile}
      />
    </NodeViewWrapper>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
