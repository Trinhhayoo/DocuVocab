import PrismaDocRepository from "@/feature/core/doc/data/repository/prisma-doc.repository";
import getRecentDocsUsecase from "@/feature/core/doc/domain/usecase/get-recent-docs.usecase";
import getDocByIdUsecase from "@/feature/core/doc/domain/usecase/get-doc-by-id.usecase";
import { requireCurrentUser } from "@/feature/core/user/domain/usecase/current-user";
import requireCurrentUserUsecase from "@/feature/core/user/domain/usecase/require-current-user.usecase";

const docRepo = new PrismaDocRepository();

export async function getRecentDocs() {
  const user = await requireCurrentUser();
  const result = user ? await getRecentDocsUsecase(docRepo, user.id) : null;

  if (!result || !result.success) {
    return [];
  }

  return result.data.map((doc) => doc.toPlainObject());
}

export async function getDocById(docId: string) {
  const user = await requireCurrentUserUsecase();
  const result = await getDocByIdUsecase(docRepo, user.id, docId);

  if (!result.success || !result.data) {
    return null;
  }

  return {
    id: result.data.doc.id,
    title: result.data.doc.title,
    sourceUrl: result.data.doc.sourceUrl,
    siteName: result.data.doc.siteName,
    content: result.data.content
      ? result.data.content.toPlainObject()
      : null,
    vocabularies: result.data.vocabularies,
  };
}
