import { NextResponse } from "next/server";

import { explainVocabularySchema } from "@/feature/core/vocabulary/domain/params/explain-vocabulary.param";
import explainVocabularyUsecase from "@/feature/core/vocabulary/domain/usecase/explain-vocabulary.usecase";
import GeminiLLMProvider from "@/feature/support/llm/gemini-llm-provider";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("GEMINI_API_KEY:", apiKey);
  console.log(request);


  if (!apiKey) {
    return NextResponse.json(
      { success: false, message: "LLM API key not configured" },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const body = await request.json();
  const parsed = explainVocabularySchema.safeParse(body);
  console.log("Parsed request body:", parsed);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Invalid request data" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const llmProvider = new GeminiLLMProvider(apiKey);
  const result = await explainVocabularyUsecase(llmProvider, parsed.data);
  console.log("Usecase result:", result);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.failure.message },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: result.data,
    },
    { headers: CORS_HEADERS },
  );
}
