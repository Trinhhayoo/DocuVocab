"use server";

import { redirect } from "next/navigation";
import { MOCK_USER_ID } from "@/bootstrap/configs/server/constants.config";
import { createManualDocSchema } from "@/feature/core/doc/domain/params/doc.param";
import PrismaDocRepository from "@/feature/core/doc/data/repository/prisma-doc.repository";

const docRepo = new PrismaDocRepository();

export async function createManualDoc(formData: FormData) {
  const parsed = createManualDocSchema.parse({
    title: formData.get("title"),
    sourceUrl: formData.get("sourceUrl"),
  });

  const result = await docRepo.createManualDoc(MOCK_USER_ID, {
    title: parsed.title,
    sourceUrl: parsed.sourceUrl,
  });

  if (!result.success) {
    throw new Error(result.failure.message);
  }

  redirect(`/docs/${result.data.id}`);
}

