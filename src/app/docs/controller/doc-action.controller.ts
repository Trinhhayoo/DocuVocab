"use server";

import { redirect } from "next/navigation";
import { createManualDocSchema } from "@/feature/core/doc/domain/params/doc.param";
import PrismaDocRepository from "@/feature/core/doc/data/repository/prisma-doc.repository";
import { requireCurrentUser } from "@/feature/core/user/domain/usecase/current-user";

const docRepo = new PrismaDocRepository();

export async function createManualDoc(formData: FormData) {
  const parsed = createManualDocSchema.parse({
    title: formData.get("title"),
    sourceUrl: formData.get("sourceUrl"),
  });

  const user = await requireCurrentUser();
  const result = await docRepo.createManualDoc(user.id, {
    title: parsed.title,
    sourceUrl: parsed.sourceUrl,
  });

  if (!result.success) {
    throw new Error(result.failure.message);
  }

  redirect(`/docs/${result.data.id}`);
}
