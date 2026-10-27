import z from "zod";

export const updateSettingsSchema = z.object({
  allowGlobalVocabulary: z.boolean(),
});

export type UpdateSettings = z.infer<typeof updateSettingsSchema>;