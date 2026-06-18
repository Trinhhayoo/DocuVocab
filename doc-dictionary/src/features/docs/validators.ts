import { z } from "zod";

export const importUrlSchema = z.object({
  url: z.url("Please enter a valid URL"),
});

export type ImportUrlInput = z.infer<typeof importUrlSchema>;