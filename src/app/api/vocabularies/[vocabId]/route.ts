import { NextResponse } from "next/server";

import { MOCK_USER_ID } from "@/bootstrap/configs/server/constants.config";
import { updateVocabularySchema } from "@/feature/core/vocabulary/domain/params/vocabulary.param";
import PrismaVocabularyRepository from "@/feature/core/vocabulary/data/repository/prisma-vocabulary.repository";
import updateVocabularyUsecase from "@/feature/core/vocabulary/domain/usecase/update-vocabulary.usecase";
import VocabularyMapper from "@/feature/core/vocabulary/data/repository/vocabulary.mapper";

type RouteContext = {
  params: Promise<{
    vocabId: string;
  }>;
};

const vocabularyRepo = new PrismaVocabularyRepository();

export async function PATCH(request: Request, context: RouteContext) {
  const { vocabId } = await context.params;
  const body = await request.json();

  const parsed = updateVocabularySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid vocabulary data." },
      { status: 400 }
    );
  }

  const result = await updateVocabularyUsecase(
    vocabularyRepo,
    MOCK_USER_ID,
    vocabId,
    parsed.data,
  );

  if (!result.success) {
    const status = result.failure.message === "vocabulary.notFound" ? 404 : 500;
    return NextResponse.json(
      { error: result.failure.message },
      { status }
    );
  }

  return NextResponse.json({
    vocabulary: VocabularyMapper.toDto(result.data),
  });
}