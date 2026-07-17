import { NextRequest, NextResponse } from "next/server";

import PrismaSettingsRepository from "@/feature/core/settings/data/settings.repository";
import getSettingsUsecase from "@/feature/core/settings/domain/usecase/get-settings.usecase";
import PrismaVocabularyRepository from "@/feature/core/vocabulary/data/repository/prisma-vocabulary.repository";
import VocabularyMapper from "@/feature/core/vocabulary/data/repository/vocabulary.mapper";
import { createExtensionVocabularySchema } from "@/feature/core/vocabulary/domain/params/extension-vocabulary.param";
import type { CreateVocabularyInput } from "@/feature/core/vocabulary/domain/params/vocabulary.param";
import { requireCurrentUser } from "@/feature/core/user/domain/usecase/current-user";

const vocabularyRepo = new PrismaVocabularyRepository();
const settingsRepo = new PrismaSettingsRepository();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/extension/vocabularies?url=<pageUrl>
 * Returns vocabularies based on user settings:
 * - allowGlobalVocabulary = true  -> all user vocabularies
 * - allowGlobalVocabulary = false -> vocabularies matching current source scope
 */
export async function GET(request: NextRequest) {
  const user = await requireCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  const { searchParams } = request.nextUrl;
  const sourceUrl = searchParams.get("url");

  if (!sourceUrl) {
    return NextResponse.json(
      { success: false, message: "url query param required" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const settingsResult = await getSettingsUsecase(settingsRepo, user.id);

  if (!settingsResult.success) {
    return NextResponse.json(
      { success: false, message: settingsResult.failure.message },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const result = settingsResult.data.allowGlobalVocabulary
    ? await vocabularyRepo.findByUserId(user.id)
    : await vocabularyRepo.findByDocOrSource(user.id, {
        sourceUrl,
      });

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.failure.message },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: { vocabularies: result.data.map(VocabularyMapper.toDto) },
    },
    { headers: CORS_HEADERS },
  );
}

/**
 * POST /api/extension/vocabularies
 * Saves a new vocabulary from the extension's floating save popup.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsed = createExtensionVocabularySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Invalid vocabulary data" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const user = await requireCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401, headers: CORS_HEADERS },
    );
  }
  const result = await vocabularyRepo.create(user.id, {
    ...parsed.data,
    docId: parsed.data.docId ?? null,
  } as CreateVocabularyInput);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.failure.message },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: { vocabulary: VocabularyMapper.toDto(result.data) },
    },
    { status: 201, headers: CORS_HEADERS },
  );
}
