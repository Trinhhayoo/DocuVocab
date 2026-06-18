import { z } from "zod";

export const createVocabularySchema = z.object({
  docId: z.string().uuid(),
  word: z.string().min(1, "Word is required").max(100),
  meaning: z.string().max(500).optional(),
  note: z.string().max(1000).optional(),
  originalSentence: z.string().max(1000).optional(),
  exampleSentence: z.string().max(1000).optional(),
});

export type CreateVocabularyInput = z.infer<typeof createVocabularySchema>;