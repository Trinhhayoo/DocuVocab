import { z } from "zod";

export const importUrlSchema = z.object({
  url: z.url("Please enter a valid URL"),
});

export const createManualDocSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  sourceUrl: z.url("Source URL must be valid"),
});

export type ImportUrlInput = z.infer<typeof importUrlSchema>;
export type CreateManualDocInput = z.infer<typeof createManualDocSchema>;
