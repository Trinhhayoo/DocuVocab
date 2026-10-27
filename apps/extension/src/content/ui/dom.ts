type Child = Node | string | null | undefined | false;

/** Creates an element with attributes and children; strings become text nodes, so page text is never parsed as HTML. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Readonly<Record<string, string>> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  for (const child of children) {
    if (child) element.append(child);
  }
  return element;
}

const VIEWPORT_MARGIN = 8;

/** Places a fixed element of `size` below `anchor`, or above it when there is no room, inside the viewport. */
export function placeNear(anchor: DOMRect, size: { width: number; height: number }) {
  const maxLeft = window.innerWidth - size.width - VIEWPORT_MARGIN;
  const left = Math.max(VIEWPORT_MARGIN, Math.min(anchor.left, maxLeft));
  const below = anchor.bottom + VIEWPORT_MARGIN;
  const fitsBelow = below + size.height <= window.innerHeight - VIEWPORT_MARGIN;
  const top = fitsBelow ? below : Math.max(VIEWPORT_MARGIN, anchor.top - size.height - VIEWPORT_MARGIN);

  return { left, top };
}
