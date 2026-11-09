import { AI_MODELS } from "@docuvocab/shared";
import z from "zod";

const aiModelIds = AI_MODELS.map((model) => model.id) as [string, ...string[]];

/** Each field is optional, so a client can change one setting without sending the others. */
export const updateSettingsSchema = z.object({
  allowGlobalVocabulary: z.boolean().optional(),
  aiModel: z.enum(aiModelIds).nullable().optional(),
});

export type UpdateSettings = z.infer<typeof updateSettingsSchema>;

export const connectOpenRouterSchema = z.object({
  code: z.string().trim().min(1).max(512),
  codeVerifier: z.string().trim().min(43).max(128),
});

export type ConnectOpenRouterInput = z.infer<typeof connectOpenRouterSchema>;
