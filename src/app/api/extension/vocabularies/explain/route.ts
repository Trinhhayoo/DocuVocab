import { NextResponse } from "next/server";

import { explainVocabularySchema } from "@/feature/core/vocabulary/domain/params/explain-vocabulary.param";
import explainVocabularyUsecase from "@/feature/core/vocabulary/domain/usecase/explain-vocabulary.usecase";
import GeminiLLMProvider from "@/feature/support/llm/ollama-llm-provider";
import { requireCurrentUser } from "@/feature/core/user/domain/usecase/current-user";

export async function POST(request: Request) {
  const user = await requireCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const apiKey = process.env.OLLAMA_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, message: "LLM API key not configured" },
      { status: 500 },
    );
  }

  const body = await request.json();
  const parsed = explainVocabularySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Invalid request data" },
      { status: 400 },
    );
  }

  const llmProvider = new GeminiLLMProvider(apiKey);
  const result = await explainVocabularyUsecase(llmProvider, parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.failure.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: result.data,
    },
  );
}
