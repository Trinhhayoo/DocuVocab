import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { MOCK_USER_ID } from "@/lib/constants";
import { createVocabularySchema } from "@/features/vocab/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = createVocabularySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid vocabulary data" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const vocabulary = await prisma.vocabulary.create({
      data: {
        userId: MOCK_USER_ID,
        docId: data.docId,
        word: data.word.trim(),
        meaning: data.meaning?.trim() || null,
        note: data.note?.trim() || null,
        originalSentence: data.originalSentence?.trim() || null,
        exampleSentence: data.exampleSentence?.trim() || null,
        status: "new",
      },
      select: {
        id: true,
        word: true,
        meaning: true,
        note: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      vocabulary: {
        ...vocabulary,
        createdAt: vocabulary.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[CREATE_VOCABULARY_ERROR]", error);

    return NextResponse.json(
      { error: "Could not save vocabulary." },
      { status: 500 }
    );
  }
}