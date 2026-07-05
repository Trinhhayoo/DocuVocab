import { z } from "zod";

/**
 * Schema for creating vocabulary from the browser extension.
 * docId is optional because the extension works on arbitrary pages
 * that may not be imported as docs in the app.
 */
export const createExtensionVocabularySchema = z.object({
  docId: z.string().optional(),
  word: z.string().min(1, "Word is required").max(100),
  meaning: z.string().max(500).optional(),
  sourceUrl: z.string().url().optional(),
  sourceHostname: z.string().max(255).optional(),
  pageTitle: z.string().max(255).optional(),
  note: z.string().max(1000).optional(),
  originalSentence: z.string().max(1000).optional(),
  exampleSentence: z.string().max(1000).optional(),
});

export type CreateExtensionVocabularyInput = z.infer<
  typeof createExtensionVocabularySchema
>;
