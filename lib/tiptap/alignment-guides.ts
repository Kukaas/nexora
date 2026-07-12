/**
 * Smart alignment guides for the free-canvas node views (image, text, shape).
 * While an element is dragged, its edges and centers are compared against the
 * page (left/center/right, top/middle/bottom) and every other floating element;
 * when one lines up within a small threshold the element snaps to it and a guide
 * line is drawn — the Word/Figma "it's aligned" indicator.
 *
 * Positions are in **percentages of the page**, matching the units every
 * floating element stores. Guides are drawn imperatively into a transient
 * overlay appended to the `.nx-doc` sheet (outside ProseMirror's editable DOM,
 * so it never reaches the saved HTML).
 */

export interface MovingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GuideSession {
  rect: DOMRect;
  xs: number[];
  ys: number[];
  overlay: HTMLElement;
}

/** How close (in % of the page) an edge must be to snap. */
const THRESHOLD = 0.6;

const FLOAT_SELECTOR = ".nx-float-image, .nx-float-text, .nx-float-shape";

function overlayFor(sheet: HTMLElement): HTMLElement {
  let overlay = sheet.querySelector<HTMLElement>(":scope > .nx-guides");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "nx-guides";
    sheet.appendChild(overlay);
  }
  return overlay;
}

/** Snapshot the guide targets at drag start (they don't move mid-drag). */
export function beginGuides(
  sheet: HTMLElement | null,
  movingEl: HTMLElement | null,
): GuideSession | null {
  if (!sheet) return null;
  const rect = sheet.getBoundingClientRect();
  const xs = [0, 50, 100]; // page left / center / right
  const ys = [0, 50, 100]; // page top / middle / bottom

  sheet.querySelectorAll<HTMLElement>(FLOAT_SELECTOR).forEach((el) => {
    if (movingEl && (el === movingEl || el.contains(movingEl))) return;
    const r = el.getBoundingClientRect();
    const left = ((r.left - rect.left) / rect.width) * 100;
    const right = ((r.right - rect.left) / rect.width) * 100;
    const top = ((r.top - rect.top) / rect.height) * 100;
    const bottom = ((r.bottom - rect.top) / rect.height) * 100;
    xs.push(left, (left + right) / 2, right);
    ys.push(top, (top + bottom) / 2, bottom);
  });

  return { rect, xs, ys, overlay: overlayFor(sheet) };
}

/** Snap the box to the nearest guide on each axis and draw the guide lines.
 * Returns the (possibly snapped) x/y in % of page. */
export function updateGuides(
  session: GuideSession,
  box: MovingBox,
): { x: number; y: number } {
  const snap = (
    origin: number,
    edges: number[],
    targets: number[],
  ): { value: number; line: number | null } => {
    let best = THRESHOLD;
    let value = origin;
    let line: number | null = null;
    for (const edge of edges) {
      for (const target of targets) {
        const distance = Math.abs(edge - target);
        if (distance < best) {
          best = distance;
          value = origin + (target - edge);
          line = target;
        }
      }
    }
    return { value, line };
  };

  const x = snap(
    box.x,
    [box.x, box.x + box.width / 2, box.x + box.width],
    session.xs,
  );
  const y = snap(
    box.y,
    [box.y, box.y + box.height / 2, box.y + box.height],
    session.ys,
  );

  session.overlay.replaceChildren();
  if (x.line !== null) {
    const v = document.createElement("div");
    v.className = "nx-guide-v";
    v.style.left = `${x.line}%`;
    session.overlay.appendChild(v);
  }
  if (y.line !== null) {
    const h = document.createElement("div");
    h.className = "nx-guide-h";
    h.style.top = `${y.line}%`;
    session.overlay.appendChild(h);
  }

  return { x: x.value, y: y.value };
}

/** Remove any drawn guides at drag end. */
export function endGuides(session: GuideSession | null): void {
  session?.overlay.replaceChildren();
}
