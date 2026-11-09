import { NextRequest, NextResponse } from "next/server";

import PrismaVocabularyRepository from "@/feature/core/vocabulary/data/repository/prisma-vocabulary.repository";
import VocabularyMapper from "@/feature/core/vocabulary/data/repository/vocabulary.mapper";
import { updateVocabularySchema } from "@/feature/core/vocabulary/domain/params/vocabulary.param";
import updateVocabularyUsecase from "@/feature/core/vocabulary/domain/usecase/update-vocabulary.usecase";
import { requireCurrentUser } from "@/feature/core/user/domain/usecase/current-user";

type RouteContext = {
  params: Promise<{
    vocabId: string;
  }>;
};

const vocabularyRepo = new PrismaVocabularyRepository();

/**
 * PATCH /api/extension/vocabularies/:vocabId
 * Updates a saved vocabulary from the extension's save popup.
 * A `null` field clears it; an omitted field is left unchanged.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await requireCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = updateVocabularySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Invalid vocabulary data" },
      { status: 400 },
    );
  }

  const { vocabId } = await context.params;
  const result = await updateVocabularyUsecase(
    vocabularyRepo,
    user.id,
    vocabId,
    parsed.data,
  );

  if (!result.success) {
    const status = result.failure.message === "vocabulary.notFound" ? 404 : 500;
    return NextResponse.json(
      { success: false, message: result.failure.message },
      { status },
    );
  }

  return NextResponse.json({
    success: true,
    data: { vocabulary: VocabularyMapper.toDto(result.data) },
  });
}
