import { NextResponse } from "next/server";

import { explainVocabularySchema } from "@/feature/core/vocabulary/domain/params/explain-vocabulary.param";
import explainVocabularyUsecase from "@/feature/core/vocabulary/domain/usecase/explain-vocabulary.usecase";
import GeminiLLMProvider from "@/feature/support/llm/gemini-llm-provider";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("GEMINI_API_KEY:", apiKey);

  if (!apiKey) {
    return NextResponse.json(
      { success: false, status: "500", message: "LLM API key not configured" },
      { status: 500 },
    );
  }

  const body = await request.json();
  const parsed = explainVocabularySchema.safeParse(body);
  console.log("Parsed request body:", parsed);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, status: "400", message: "Invalid request data" },
      { status: 400 },
    );
  }

  // const llmProvider = new GeminiLLMProvider(apiKey);
  // const result = await explainVocabularyUsecase(llmProvider, parsed.data);

  // if (!result.success) {
  //   return NextResponse.json(
  //     { success: false, status: "500", message: result.failure.message },
  //     { status: 500 },
  //   );
  // }

  // return NextResponse.json({
  //   success: true,
  //   status: "200",
  //   data: result.data,
  // });

  try {
  const llmProvider = new GeminiLLMProvider(apiKey);
  const result = await explainVocabularyUsecase(llmProvider, parsed.data);

  console.log("Usecase result:", result);

  if (!result.success) {
    console.error("Explain failed:", result.failure);

    return NextResponse.json(
      { success: false, message: result.failure.message },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    { success: true, data: result.data },
    { headers: CORS_HEADERS },
  );
} catch (error) {
  console.error("Unexpected explain error:", error);

  return NextResponse.json(
    {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    },
    { status: 500, headers: CORS_HEADERS },
  );
}
}

