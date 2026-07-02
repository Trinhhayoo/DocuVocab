import { NextResponse } from "next/server";

import { MOCK_USER_ID } from "@/bootstrap/configs/server/constants.config";
import { createVocabularySchema } from "@/feature/core/vocabulary/domain/params/vocabulary.param";
import PrismaVocabularyRepository from "@/feature/core/vocabulary/data/repository/prisma-vocabulary.repository";
import createVocabularyUsecase from "@/feature/core/vocabulary/domain/usecase/create-vocabulary.usecase";
import VocabularyMapper from "@/feature/core/vocabulary/data/repository/vocabulary.mapper";

const vocabularyRepo = new PrismaVocabularyRepository();

export async function POST(request: Request) {
  const body = await request.json();

  const parsed = createVocabularySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid vocabulary data" },
      { status: 400 }
    );
  }

  const result = await createVocabularyUsecase(
    vocabularyRepo,
    MOCK_USER_ID,
    parsed.data,
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.failure.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    vocabulary: VocabularyMapper.toDto(result.data),
  });
}