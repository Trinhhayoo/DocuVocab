import type { Result } from "@/feature/common/data/result";

import Feedback from "../entity/feedback.entity";
import type FeedbackRepository from "../i-repo/feedback.repository.interface";
import type { CreateFeedbackInput } from "../params/feedback.param";

export default async function createFeedbackUsecase(
  repo: FeedbackRepository,
  userId: string | null,
  input: CreateFeedbackInput,
): Promise<Result<Feedback>> {
  return repo.create(userId, input);
}