"use server";

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from "@/lib/prisma";
import { MOCK_USER_ID } from "@/lib/constants";

const createManualSchema = z.object ({
    title: z.string().min(1, "Title is required").max(200),
    sourceUrl: z.string().url("Source URL must be valid"),
});

export async function createManualDoc(formData: FormData){

    const createManualDocDto = createManualSchema.parse({
        title: formData.get("title"),
        sourceUrl: formData.get("sourceUrl"),
    });

    if (!createManualDocDto) {
        throw new Error("Invalid form data");
    }

    const doc = await prisma.doc.create({
    data: {
      userId: MOCK_USER_ID,
      title: createManualDocDto.title,
      sourceUrl: createManualDocDto.sourceUrl,
      siteName: new URL(createManualDocDto.sourceUrl).hostname,
      content: {
        create: {
          htmlContent: "",
          textContent: "",
          wordCount: 0,
        },
      },
    },
  });

  redirect(`/docs/${doc.id}`);
}

