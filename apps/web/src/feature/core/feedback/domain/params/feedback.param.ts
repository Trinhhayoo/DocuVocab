import { z } from "zod";

export const feedbackCategories = ["bug", "idea", "content", "other"] as const;

const optionalTrimmedString = (maxLength: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, z.string().max(maxLength).optional());

const optionalUrl = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.url().optional());

const optionalEmail = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.email().optional());

export const createFeedbackSchema = z.object({
  name: optionalTrimmedString(100),
  email: optionalEmail,
  category: z.enum(feedbackCategories),
  message: z
    .string()
    .trim()
    .min(10, "Please share a little more detail.")
    .max(2000),
  pageUrl: optionalUrl,
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type FeedbackCategory = (typeof feedbackCategories)[number];