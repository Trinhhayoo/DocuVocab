import { NextResponse } from "next/server";

import { MOCK_USER_ID } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { updateVocabularySchema } from "@/features/vocab/validators";

type RouteContext = {
  params: Promise<{
    vocabId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { vocabId } = await context.params;
    const body = await request.json();

    const parsed = updateVocabularySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid vocabulary data." },
        { status: 400 }
      );
    }

    const existingVocabulary = await prisma.vocabulary.findFirst({
      where: {
        id: vocabId,
        userId: MOCK_USER_ID,
      },
      select: {
        id: true,
      },
    });

    if (!existingVocabulary) {
      return NextResponse.json(
        { error: "Vocabulary not found." },
        { status: 404 }
      );
    }

    const vocabulary = await prisma.vocabulary.update({
      where: {
        id: existingVocabulary.id,
      },
      data: {
        word: parsed.data.word?.trim(),
        meaning:
          parsed.data.meaning === undefined
            ? undefined
            : parsed.data.meaning?.trim() || null,
        note:
          parsed.data.note === undefined
            ? undefined
            : parsed.data.note?.trim() || null,
        originalSentence:
          parsed.data.originalSentence === undefined
            ? undefined
            : parsed.data.originalSentence?.trim() || null,
        exampleSentence:
          parsed.data.exampleSentence === undefined
            ? undefined
            : parsed.data.exampleSentence?.trim() || null,
        status: parsed.data.status,
      },
      select: {
        id: true,
        word: true,
        meaning: true,
        note: true,
        originalSentence: true,
        exampleSentence: true,
        status: true,
      },
    });

    return NextResponse.json({ vocabulary });
  } catch (error) {
    console.error("[UPDATE_VOCABULARY_ERROR]", error);

    return NextResponse.json(
      { error: "Could not update vocabulary." },
      { status: 500 }
    );
  }
}