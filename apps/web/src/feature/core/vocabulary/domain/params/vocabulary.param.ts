import { z } from "zod";

export const createVocabularySchema = z.object({
  docId: z.string(),
  word: z.string().min(1, "Word is required").max(100),
  meaning: z.string().max(500).optional(),
  sourceUrl: z.url().optional(),
  sourceHostname: z.string().max(255).optional(),
  pageTitle: z.string().max(255).optional(),
  note: z.string().max(1000).optional(),
  originalSentence: z.string().max(1000).optional(),
  exampleSentence: z.string().max(1000).optional(),
});

export const updateVocabularySchema = z.object({
  word: z.string().min(1, "Word is required").max(100).optional(),
  meaning: z.string().max(500).nullable().optional(),
  sourceUrl: z.url().nullable().optional(),
  sourceHostname: z.string().max(255).nullable().optional(),
  pageTitle: z.string().max(255).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
  originalSentence: z.string().max(1000).nullable().optional(),
  exampleSentence: z.string().max(1000).nullable().optional(),
  status: z.string().optional(),
});

export type CreateVocabularyInput = z.infer<typeof createVocabularySchema>;
export type UpdateVocabularyInput = z.infer<typeof updateVocabularySchema>;
