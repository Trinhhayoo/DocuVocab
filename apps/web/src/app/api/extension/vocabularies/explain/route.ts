import { NextResponse } from "next/server";

import { handleExplainVocabulary } from "@/feature/core/vocabulary/data/http/explain-vocabulary.handler";
import { requireCurrentUser } from "@/feature/core/user/domain/usecase/current-user";

export async function POST(request: Request) {
  const user = await requireCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  return handleExplainVocabulary(request);
}
