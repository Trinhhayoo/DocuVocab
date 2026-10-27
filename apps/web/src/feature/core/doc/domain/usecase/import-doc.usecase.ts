import { Result, failure } from "@/feature/common/data/result";
import Doc from "../entity/doc.entity";
import DocImportFailure from "../failure/doc-import.failure";
import DocRepository from "../i-repo/doc.repository.interface";

export type ImportDocParams = {
  url: string;
  extractContent: (url: string) => Promise<{
    title: string;
    htmlContent: string;
    textContent: string;
    wordCount: number;
    siteName: string | null;
  }>;
  processHtml: (html: string, sourceUrl: string) => Promise<string>;
};

export default async function importDocUsecase(
  repo: DocRepository,
  userId: string,
  params: ImportDocParams,
): Promise<Result<Doc>> {
  try {
    const article = await params.extractContent(params.url);
    const cleanHtml = await params.processHtml(article.htmlContent, params.url);

    return repo.createDocFromImport(userId, {
      title: article.title,
      sourceUrl: params.url,
      siteName: article.siteName,
      htmlContent: cleanHtml,
      textContent: article.textContent,
      wordCount: article.wordCount,
    });
  } catch (error) {
    return failure(new DocImportFailure({ url: params.url, error }));
  }
}
