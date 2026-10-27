import { buildVocabularyRegex, normalizeWord } from "@docuvocab/shared";

import type { Vocabulary } from "@/lib/vocabulary";

export type TextMatch = Readonly<{ start: number; end: number; vocabId: string }>;

export type VocabularyMatcher = Readonly<{
  find(text: string): TextMatch[];
  findVocabulary(text: string): Vocabulary | undefined;
}>;

/** Builds a matcher over the saved words; the first vocabulary wins when two normalize to the same word. */
export function createVocabularyMatcher(vocabularies: readonly Vocabulary[]): VocabularyMatcher {
  const byWord = new Map<string, Vocabulary>();
  for (const vocabulary of vocabularies) {
    const key = normalizeWord(vocabulary.word);
    if (key && !byWord.has(key)) byWord.set(key, vocabulary);
  }

  const regex = buildVocabularyRegex([...byWord.values()].map((vocabulary) => vocabulary.word));

  return {
    find(text) {
      if (!regex) return [];

      const matches: TextMatch[] = [];
      for (const match of text.matchAll(regex)) {
        const vocabulary = byWord.get(normalizeWord(match[0]));
        if (vocabulary) {
          matches.push({ start: match.index, end: match.index + match[0].length, vocabId: vocabulary.id });
        }
      }
      return matches;
    },
    findVocabulary(text) {
      return byWord.get(normalizeWord(text));
    },
  };
}
