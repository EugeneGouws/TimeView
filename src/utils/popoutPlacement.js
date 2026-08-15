// Placement for the cell popout panels. Pure — takes measured rects, returns
// coordinates. The panel is position:fixed, so every result is clamped to the
// viewport: an off-viewport fixed panel cannot be scrolled back into view.

export const PANEL_MIN_W = 200;
export const PANEL_MAX_W = 440;
const MIN_PANEL_H = 120;
const GAP = 4;
const MARGIN = 8;

// anchor/panel: {left, right, top, bottom, width, height} in viewport coords.
// panel width/height are measured, never assumed.
export function placePanel(anchor, panel, viewport) {
  const vw = viewport.width;
  const vh = viewport.height;
  const w = Math.min(panel.width, vw - 2 * MARGIN);
  const h = panel.height;

  // Horizontal: beside the anchor, preferring the side with room for the
  // measured width; otherwise clamp to whichever edge is closer.
  let left;
  if (vw - anchor.right - GAP - MARGIN >= w) {
    left = anchor.right + GAP;
  } else if (anchor.left - GAP - MARGIN >= w) {
    left = anchor.left - w - GAP;
  } else {
    left = anchor.left + anchor.width / 2 - w / 2;
  }
  left = Math.min(Math.max(left, MARGIN), vw - w - MARGIN);

  // Vertical: top-aligned with the anchor, flipped up when the panel's real
  // height doesn't fit below. maxHeight is whatever the viewport actually
  // allows, so the panel scrolls internally rather than running off-screen.
  const spaceBelow = vh - anchor.top - MARGIN;
  const spaceAbove = anchor.bottom - MARGIN;

  let top;
  let maxHeight;
  if (h <= spaceBelow || spaceBelow >= spaceAbove) {
    top = anchor.top;
    maxHeight = spaceBelow;
  } else {
    maxHeight = spaceAbove;
    top = anchor.bottom - Math.min(h, maxHeight);
  }

  maxHeight = Math.max(MIN_PANEL_H, Math.min(maxHeight, vh - 2 * MARGIN));
  top = Math.min(Math.max(top, MARGIN), Math.max(MARGIN, vh - Math.min(h, maxHeight) - MARGIN));

  return { left, top, maxHeight, maxWidth: Math.min(PANEL_MAX_W, vw - 2 * MARGIN) };
}
