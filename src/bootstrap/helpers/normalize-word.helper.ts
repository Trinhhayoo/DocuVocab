export function normalizeWord(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^[.,;:!?()[\]{}"'“”‘’]+/, "")
    .replace(/[.,;:!?()[\]{}"'“”‘’]+$/, "");
}