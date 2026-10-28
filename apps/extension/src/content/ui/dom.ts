import { type Box, placeNear } from "@docuvocab/shared";

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

/** Moves a rendered fixed element next to `anchor`, using its real size so it stays inside the viewport. */
export function placeElementNear(element: HTMLElement, anchor: Box) {
  const { width, height } = element.getBoundingClientRect();
  const { left, top } = placeNear(anchor, { width, height }, { width: window.innerWidth, height: window.innerHeight });
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
}
