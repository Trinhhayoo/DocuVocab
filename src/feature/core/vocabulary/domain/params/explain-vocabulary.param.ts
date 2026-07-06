import { z } from "zod";

export const explainVocabularySchema = z.object({
  text: z.string().min(1, "Text is required").max(200),
  sentence: z.string().max(500).optional(),
  paragraph: z.string().max(2000).optional(),
  sourceTitle: z.string().max(255).optional(),
  sourceUrl: z.string().max(2000).optional(),
});

export type ExplainVocabularyInput = z.infer<typeof explainVocabularySchema>;
