import { NextResponse } from "next/server";

import { createVocabularySchema } from "@/feature/core/vocabulary/domain/params/vocabulary.param";
import PrismaVocabularyRepository from "@/feature/core/vocabulary/data/repository/prisma-vocabulary.repository";
import createVocabularyUsecase from "@/feature/core/vocabulary/domain/usecase/create-vocabulary.usecase";
import VocabularyMapper from "@/feature/core/vocabulary/data/repository/vocabulary.mapper";
import requireCurrentUserUsecase from "@/feature/core/user/domain/usecase/require-current-user.usecase";

const vocabularyRepo = new PrismaVocabularyRepository();

export async function POST(request: Request) {
  const user = await requireCurrentUserUsecase();
  const body = await request.json();

  const parsed = createVocabularySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, status: "400", message: "Invalid vocabulary data" },
      { status: 400 },
    );
  }

  const result = await createVocabularyUsecase(
    vocabularyRepo,
    user.id,
    parsed.data,
  );

  if (!result.success) {
    return NextResponse.json(
      { success: false, status: "500", message: result.failure.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    status: "200",
    data: { vocabulary: VocabularyMapper.toDto(result.data) },
  });
}