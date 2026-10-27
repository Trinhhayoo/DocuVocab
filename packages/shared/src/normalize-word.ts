const EDGE_PUNCTUATION = /^[.,;:!?()[\]{}"'“”‘’]+|[.,;:!?()[\]{}"'“”‘’]+$/g;

/** Collapses whitespace and strips edge punctuation, keeping inner marks such as the apostrophe in "Claude's". */
export function cleanSelectedText(value: string) {
  return value.replace(/\s+/g, " ").trim().replace(EDGE_PUNCTUATION, "").trim();
}

export function normalizeWord(value: string) {
  return cleanSelectedText(value).toLowerCase().replace(/’/g, "'");
}
