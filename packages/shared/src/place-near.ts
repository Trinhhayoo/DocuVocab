export type Box = Readonly<{ top: number; bottom: number; left: number; right: number }>;
export type Size = Readonly<{ width: number; height: number }>;
export type Side = "above" | "below";

const VIEWPORT_MARGIN = 8;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}

/**
 * Positions a fixed element of `size` next to `anchor`, centered on it and kept fully inside `viewport`.
 * Uses the `prefer` side when it fits, otherwise the other side.
 */
export function placeNear(anchor: Box, size: Size, viewport: Size, prefer: Side = "below") {
  const anchorCenter = (anchor.left + anchor.right) / 2;
  const left = clamp(anchorCenter - size.width / 2, VIEWPORT_MARGIN, viewport.width - size.width - VIEWPORT_MARGIN);

  const above = anchor.top - size.height - VIEWPORT_MARGIN;
  const below = anchor.bottom + VIEWPORT_MARGIN;
  const fitsAbove = above >= VIEWPORT_MARGIN;
  const fitsBelow = below + size.height <= viewport.height - VIEWPORT_MARGIN;
  const useAbove = prefer === "above" ? fitsAbove || !fitsBelow : !fitsBelow && fitsAbove;

  const top = clamp(useAbove ? above : below, VIEWPORT_MARGIN, viewport.height - size.height - VIEWPORT_MARGIN);

  return { left, top };
}
