"use client";

import type React from "react";

/**
 * Shared 8-direction resize handles for the free-canvas node views (image,
 * text, shape). Each handle drags an edge or corner; deltas are converted to
 * **percentages of the page** (via the `.nx-doc` sheet rect) so geometry stays
 * in the same units every floating element uses. The node view decides how to
 * apply the resulting box (e.g. an image keeps aspect on corners, a text box
 * only takes width).
 */

export type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** All 8 handles (edges + corners); the common case for boxed elements. */
export const ALL_DIRS: ResizeDir[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
/** Horizontal-only (a line, or a width-driven text box). */
export const X_DIRS: ResizeDir[] = ["e", "w"];

const MIN = 3; // smallest side, in % of the page
/** How far a box may bleed off the top/left edge (matches the drag clamp). The
 * right/bottom edges are held to the page so content can't print off-sheet. */
const BLEED = 5;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** New box from dragging `dir` by (dx, dy) in % of page — moves only the dragged
 * edge(s), pins the opposite edge, and holds every edge to the page so a box
 * can't be sized off the right/bottom of the sheet (the print view clips
 * anything past the page, so off-sheet == lost on paper). */
export function resizeBox(start: Box, dir: ResizeDir, dx: number, dy: number): Box {
  let left = start.x;
  let top = start.y;
  let right = start.x + start.width;
  let bottom = start.y + start.height;

  // No direction carries both "e"&"w" or "n"&"s", so the pinned edge each clamp
  // reads (left/right/top/bottom) is always the untouched start value.
  if (dir.includes("e")) right = clamp(start.x + start.width + dx, left + MIN, 100);
  if (dir.includes("w")) left = clamp(start.x + dx, -BLEED, right - MIN);
  if (dir.includes("s")) bottom = clamp(start.y + start.height + dy, top + MIN, 100);
  if (dir.includes("n")) top = clamp(start.y + dy, -BLEED, bottom - MIN);

  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function ResizeHandles({
  dirs,
  sheetRect,
  getBox,
  onResize,
  onActive,
}: {
  dirs: ResizeDir[];
  sheetRect: () => DOMRect | null;
  getBox: () => Box;
  onResize: (box: Box, dir: ResizeDir) => void;
  onActive?: (active: boolean) => void;
}) {
  const begin = (dir: ResizeDir) => (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = sheetRect();
    if (!rect) return;
    const start = getBox();
    const sx = event.clientX;
    const sy = event.clientY;
    onActive?.(true);

    const move = (e: PointerEvent) => {
      const dx = ((e.clientX - sx) / rect.width) * 100;
      const dy = ((e.clientY - sy) / rect.height) * 100;
      onResize(resizeBox(start, dir, dx, dy), dir);
    };
    const up = () => {
      onActive?.(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <>
      {dirs.map((dir) => (
        <span
          key={dir}
          role="presentation"
          aria-label={`Resize ${dir}`}
          className={`nx-rz nx-rz-${dir}`}
          onPointerDown={begin(dir)}
        />
      ))}
    </>
  );
}
