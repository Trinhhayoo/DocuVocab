import { handleExplainVocabulary } from "@/feature/core/vocabulary/data/http/explain-vocabulary.handler";
import requireCurrentUserApiUsecase from "@/feature/core/user/domain/usecase/require-current-user-api.usecase";
import { nextApiUnauthorized } from "@/feature/common/data/http/next-api-response";

export async function POST(request: Request) {
  const authResult = await requireCurrentUserApiUsecase();

  if (!authResult.success) {
    return nextApiUnauthorized(authResult.failure.message);
  }

  return handleExplainVocabulary(request);
}
