import { NextResponse } from "next/server";

import { updateVocabularySchema } from "@/feature/core/vocabulary/domain/params/vocabulary.param";
import PrismaVocabularyRepository from "@/feature/core/vocabulary/data/repository/prisma-vocabulary.repository";
import updateVocabularyUsecase from "@/feature/core/vocabulary/domain/usecase/update-vocabulary.usecase";
import VocabularyMapper from "@/feature/core/vocabulary/data/repository/vocabulary.mapper";
import { requireCurrentUser } from "@/feature/core/user/domain/usecase/current-user";

type RouteContext = {
  params: Promise<{
    vocabId: string;
  }>;
};

const vocabularyRepo = new PrismaVocabularyRepository();

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, status: "401", message: "Unauthorized" },
      { status: 401 },
    );
  }
  const { vocabId } = await context.params;
  const body = await request.json();

  const parsed = updateVocabularySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, status: "400", message: "Invalid vocabulary data." },
      { status: 400 },
    );
  }

  const result = await updateVocabularyUsecase(
    vocabularyRepo,
    user.id,
    vocabId,
    parsed.data,
  );

  if (!result.success) {
    const status = result.failure.message === "vocabulary.notFound" ? 404 : 500;
    return NextResponse.json(
      { success: false, status: String(status), message: result.failure.message },
      { status },
    );
  }

  return NextResponse.json({
    success: true,
    status: "200",
    data: { vocabulary: VocabularyMapper.toDto(result.data) },
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { vocabId } = await context.params;

  const user = await requireCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, status: "401", message: "Unauthorized" },
      { status: 401 },
    );
  }
  const result = await vocabularyRepo.delete(user.id, vocabId);

  if (!result.success) {
    const status = result.failure.message === "vocabulary.notFound" ? 404 : 500;
    return NextResponse.json(
      { success: false, status: String(status), message: result.failure.message },
      { status },
    );
  }

  return NextResponse.json({
    success: true,
    status: "200",
    message: "Vocabulary deleted successfully.",
  });
}