/** Text that is not rendered prose, is code, or is being edited by the user. */
const SKIP_SELECTOR = [
  "script",
  "style",
  "noscript",
  "template",
  "textarea",
  "input",
  "select",
  "option",
  "pre",
  "code",
  "svg",
  "math",
  "[contenteditable]:not([contenteditable='false'])",
].join(",");

export function isText(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function isHighlightable(node: Node, ownHost: Element | null) {
  const parent = node.parentElement;
  if (!parent || !node.textContent?.trim()) return false;
  return !parent.closest(SKIP_SELECTOR) && !ownHost?.contains(parent);
}

/** Collects the highlightable text nodes under `root`, skipping `ownHost` (the extension's UI). */
export function collectTextNodes(root: Node, ownHost: Element | null): Text[] {
  if (isText(root)) return isHighlightable(root, ownHost) ? [root] : [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (isHighlightable(node, ownHost) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) {
    if (isText(walker.currentNode)) nodes.push(walker.currentNode);
  }
  return nodes;
}
