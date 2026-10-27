import { NextResponse } from "next/server";

import type IBaseHttpResponse from "@/feature/common/data/http/i-base-http-response";
import {
  nextApiFailure,
  nextApiSuccess,
  nextApiValidationError,
} from "@/feature/common/data/http/next-api-response";
import createLlmProvider from "@/feature/support/llm/create-llm-provider";
import type LLMProvider from "@/feature/support/llm/llm-provider.interface";
import { explainVocabularySchema } from "../../domain/params/explain-vocabulary.param";
import explainVocabularyUsecase from "../../domain/usecase/explain-vocabulary.usecase";

/** Shared body of the web and extension explain routes; callers check auth first. */
export async function handleExplainVocabulary(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = explainVocabularySchema.safeParse(body);

  if (!parsed.success) {
    return nextApiValidationError(parsed.error.flatten());
  }

  let llmProvider: LLMProvider;

  try {
    llmProvider = createLlmProvider();
  } catch (error) {
    console.error("LLM provider is not configured:", error);

    const responseBody: IBaseHttpResponse = {
      success: false,
      status: "500",
      message: "AI explanations are not configured.",
    };

    return NextResponse.json(responseBody, { status: 500 });
  }

  const result = await explainVocabularyUsecase(llmProvider, parsed.data);

  if (!result.success) {
    console.error("Explain failed:", result.failure);
    return nextApiFailure(result.failure, 500);
  }

  return nextApiSuccess(result.data);
}
