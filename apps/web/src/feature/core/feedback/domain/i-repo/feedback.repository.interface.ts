import type { Result } from "@/feature/common/data/result";

import Feedback from "../entity/feedback.entity";
import type { CreateFeedbackInput } from "../params/feedback.param";

export default interface FeedbackRepository {
  create(userId: string | null, input: CreateFeedbackInput): Promise<Result<Feedback>>;
}

export const feedbackRepoKey = "feedbackRepoKey";