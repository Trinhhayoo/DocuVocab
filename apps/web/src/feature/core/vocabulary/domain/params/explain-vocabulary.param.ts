import { z } from "zod";

export const explainVocabularySchema = z.object({
  text: z.string().trim().min(1, "Text is required").max(1000),
  sentence: z.string().max(1000).optional(),
  paragraph: z.string().max(2000).optional(),
  sourceTitle: z.string().max(255).optional(),
  sourceUrl: z.string().max(2000).optional(),
});

export type ExplainVocabularyInput = z.infer<typeof explainVocabularySchema>;
