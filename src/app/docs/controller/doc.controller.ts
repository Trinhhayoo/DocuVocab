import { MOCK_USER_ID } from "@/bootstrap/configs/server/constants.config";
import PrismaDocRepository from "@/feature/core/doc/data/repository/prisma-doc.repository";
import getRecentDocsUsecase from "@/feature/core/doc/domain/usecase/get-recent-docs.usecase";
import getDocByIdUsecase from "@/feature/core/doc/domain/usecase/get-doc-by-id.usecase";

const docRepo = new PrismaDocRepository();

export async function getRecentDocs() {
  const result = await getRecentDocsUsecase(docRepo, MOCK_USER_ID);

  if (!result.success) {
    return [];
  }

  return result.data.map((doc) => doc.toPlainObject());
}

export async function getDocById(docId: string) {
  const result = await getDocByIdUsecase(docRepo, MOCK_USER_ID, docId);

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
