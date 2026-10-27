const SENTENCE_END = /[.!?]/;
const MAX_SENTENCE_LENGTH = 500;
const FALLBACK_LENGTH = 200;

/** Returns the sentence in `fullText` that contains `selected`, bounded by `.`, `!` or `?`. */
export function extractSentence(fullText: string, selected: string) {
  const index = fullText.indexOf(selected);

  if (index === -1) {
    return fullText.slice(0, FALLBACK_LENGTH).trim();
  }

  let start = index;
  while (start > 0 && !SENTENCE_END.test(fullText.charAt(start - 1))) {
    start--;
  }

  let end = index + selected.length;
  while (end < fullText.length && !SENTENCE_END.test(fullText.charAt(end))) {
    end++;
  }

  if (end < fullText.length) {
    end++;
  }

  return fullText.slice(start, end).trim().slice(0, MAX_SENTENCE_LENGTH);
}
