function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toWordPattern(word: string) {
  return escapeRegExp(word).replace(/['’]/g, "['’]");
}

/**
 * Builds one regex matching any of the words, longest first so phrases win over their parts.
 * Uses letter/number boundaries instead of \b, so "C++" and accented words match too.
 */
export function buildVocabularyRegex(words: readonly string[]) {
  const patterns = words
    .map((word) => word.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map(toWordPattern);

  if (patterns.length === 0) return null;

  return new RegExp(
    `(?<![\\p{L}\\p{N}_])(${patterns.join("|")})(?![\\p{L}\\p{N}_])`,
    "giu"
  );
}
