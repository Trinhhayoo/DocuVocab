import { NextRequest, NextResponse } from "next/server";

import PrismaVocabularyRepository from "@/feature/core/vocabulary/data/repository/prisma-vocabulary.repository";
import VocabularyMapper from "@/feature/core/vocabulary/data/repository/vocabulary.mapper";
import { createExtensionVocabularySchema } from "@/feature/core/vocabulary/domain/params/extension-vocabulary.param";
import { requireCurrentUser } from "@/feature/core/user/domain/usecase/current-user";

const vocabularyRepo = new PrismaVocabularyRepository();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/extension/vocabularies?url=<pageUrl>&hostname=<hostname>
 * Returns vocabularies for a given page URL so the extension can highlight them.
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
  const sourceHostname = searchParams.get("hostname");

  if (!sourceUrl || !sourceHostname) {
    return NextResponse.json(
      { success: false, message: "url and hostname query params required" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const result = await vocabularyRepo.findBySource(
    user.id,
    sourceUrl,
    sourceHostname,
  );

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
  } as any);

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
