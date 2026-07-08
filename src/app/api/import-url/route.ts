import { extractReadableContent } from "@/lib/readability";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { normalizeHtmlUrls } from "@/lib/normalize-html";
import { highlightCodeBlocks } from "@/lib/highlight-code";
import { importUrlSchema } from "@/feature/core/doc/domain/params/doc.param";
import PrismaDocRepository from "@/feature/core/doc/data/repository/prisma-doc.repository";
import importDocUsecase from "@/feature/core/doc/domain/usecase/import-doc.usecase";
import requireCurrentUserApiUsecase from "@/feature/core/user/domain/usecase/require-current-user-api.usecase";
import {
  nextApiFailure,
  nextApiSuccess,
  nextApiUnauthorized,
  nextApiValidationError,
} from "@/feature/common/data/http/next-api-response";

const docRepo = new PrismaDocRepository();

async function processHtml(html: string, sourceUrl: string): Promise<string> {
  const normalizedHtml = normalizeHtmlUrls(html, sourceUrl);
  const highlightedHtml = await highlightCodeBlocks(normalizedHtml);
  return sanitizeHtml(highlightedHtml);
}

export async function POST(request: Request) {
  const authResult = await requireCurrentUserApiUsecase();

  if (!authResult.success) {
    return nextApiUnauthorized(authResult.failure.message);
  }

  const body = await request.json().catch(() => null);
  const parsed = importUrlSchema.safeParse(body);

  if (!parsed.success) {
    return nextApiValidationError(parsed.error.flatten());
  }

  const result = await importDocUsecase(docRepo, authResult.data.id, {
    url: parsed.data.url,
    extractContent: extractReadableContent,
    processHtml,
  });

  if (!result.success) {
    return nextApiFailure(result.failure, 500);
  }

  return nextApiSuccess(
    { docId: result.data.id },
    "Document imported successfully",
  );
}