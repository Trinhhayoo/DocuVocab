import { NextResponse } from "next/server";

import { MOCK_USER_ID } from "@/bootstrap/configs/server/constants.config";
import { extractReadableContent } from "@/lib/readability";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { normalizeHtmlUrls } from "@/lib/normalize-html";
import { highlightCodeBlocks } from "@/lib/highlight-code";
import { importUrlSchema } from "@/feature/core/doc/domain/params/doc.param";
import PrismaDocRepository from "@/feature/core/doc/data/repository/prisma-doc.repository";
import importDocUsecase from "@/feature/core/doc/domain/usecase/import-doc.usecase";

const docRepo = new PrismaDocRepository();

async function processHtml(html: string, sourceUrl: string): Promise<string> {
  const normalizedHtml = normalizeHtmlUrls(html, sourceUrl);
  const highlightedHtml = await highlightCodeBlocks(normalizedHtml);
  return sanitizeHtml(highlightedHtml);
}

export async function POST(request: Request) {
  const body = await request.json();

  const parsed = importUrlSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid URL" },
      { status: 400 }
    );
  }

  const result = await importDocUsecase(docRepo, MOCK_USER_ID, {
    url: parsed.data.url,
    extractContent: extractReadableContent,
    processHtml,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.failure.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    docId: result.data.id,
  });
}