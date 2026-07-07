import { NextResponse } from "next/server";

import { extractReadableContent } from "@/lib/readability";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { normalizeHtmlUrls } from "@/lib/normalize-html";
import { highlightCodeBlocks } from "@/lib/highlight-code";
import { importUrlSchema } from "@/feature/core/doc/domain/params/doc.param";
import PrismaDocRepository from "@/feature/core/doc/data/repository/prisma-doc.repository";
import importDocUsecase from "@/feature/core/doc/domain/usecase/import-doc.usecase";
import requireCurrentUserUsecase from "@/feature/core/user/domain/usecase/require-current-user.usecase";

const docRepo = new PrismaDocRepository();

async function processHtml(html: string, sourceUrl: string): Promise<string> {
  const normalizedHtml = normalizeHtmlUrls(html, sourceUrl);
  const highlightedHtml = await highlightCodeBlocks(normalizedHtml);
  return sanitizeHtml(highlightedHtml);
}

export async function POST(request: Request) {
  const user = await requireCurrentUserUsecase();
  const body = await request.json();

  const parsed = importUrlSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, status: "400", message: "Invalid URL" },
      { status: 400 },
    );
  }

  const result = await importDocUsecase(docRepo, user.id, {
    url: parsed.data.url,
    extractContent: extractReadableContent,
    processHtml,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, status: "500", message: result.failure.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    status: "200",
    data: { docId: result.data.id },
  });
}