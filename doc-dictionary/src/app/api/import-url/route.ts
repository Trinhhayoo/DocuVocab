import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { MOCK_USER_ID } from "@/lib/constants";
import { extractReadableContent } from "@/lib/readability";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { importUrlSchema } from "@/features/docs/validators";
import { normalizeHtmlUrls } from "@/lib/normalize-html";
import { highlightCodeBlocks } from "@/lib/highlight-code";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = importUrlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid URL",
        },
        {
          status: 400,
        }
      );
    }

    const { url } = parsed.data;

    const existingDoc = await prisma.doc.findFirst({
        where: {
            userId: MOCK_USER_ID,
            sourceUrl: url,
        },
        select: {
            id: true,
        }
    });

    if (existingDoc) {
        return NextResponse.json({
      docId: existingDoc.id,
    });
    }

    const article = await extractReadableContent(url);

    const normalizedHtml = normalizeHtmlUrls(article.htmlContent, url);
    const highlightedHtml = await highlightCodeBlocks(normalizedHtml);
    const cleanHtml = sanitizeHtml(highlightedHtml);

    const doc = await prisma.doc.create({
      data: {
        userId: MOCK_USER_ID,
        title: article.title,
        sourceUrl: url,
        siteName: article.siteName,
        content: {
          create: {
            htmlContent: cleanHtml,
            textContent: article.textContent,
            wordCount: article.wordCount,
          },
        },
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      docId: doc.id,
    });
  } catch (error) {
    console.error("[IMPORT_URL_ERROR]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not import this URL.",
      },
      {
        status: 500,
      }
    );
  }
}