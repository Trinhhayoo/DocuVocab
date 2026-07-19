import {
  nextApiFailure,
  nextApiSuccess,
  nextApiValidationError,
} from "@/feature/common/data/http/next-api-response";
import PrismaFeedbackRepository from "@/feature/core/feedback/data/repository/prisma-feedback.repository";
import FeedbackMapper from "@/feature/core/feedback/data/repository/feedback.mapper";
import createFeedbackUsecase from "@/feature/core/feedback/domain/usecase/create-feedback.usecase";
import { createFeedbackSchema } from "@/feature/core/feedback/domain/params/feedback.param";
import requireCurrentUserApiUsecase from "@/feature/core/user/domain/usecase/require-current-user-api.usecase";

const feedbackRepo = new PrismaFeedbackRepository();

export async function POST(request: Request) {
  const authResult = await requireCurrentUserApiUsecase();
  const body = await request.json().catch(() => null);
  const parsed = createFeedbackSchema.safeParse(body);

  if (!parsed.success) {
    return nextApiValidationError(parsed.error.flatten());
  }

  const result = await createFeedbackUsecase(
    feedbackRepo,
    authResult.success ? authResult.data.id : null,
    {
      ...parsed.data,
      email: parsed.data.email ?? (authResult.success ? authResult.data.email ?? undefined : undefined),
    },
  );

  if (!result.success) {
    return nextApiFailure(result.failure, 500);
  }

  return nextApiSuccess(
    { feedback: FeedbackMapper.toDto(result.data) },
    "Feedback submitted successfully",
  );
}