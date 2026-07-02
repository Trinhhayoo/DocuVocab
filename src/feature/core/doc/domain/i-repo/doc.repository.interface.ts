import { Result } from "@/feature/common/data/result";
import Doc from "../entity/doc.entity";
import DocContent from "../entity/doc-content.entity";

export type DocWithContent = {
  doc: Doc;
  content: DocContent | null;
  vocabularies: Array<{
    id: string;
    word: string;
    meaning: string | null;
    note: string | null;
    originalSentence: string | null;
    exampleSentence: string | null;
    status: string;
  }>;
};

export default interface DocRepository {
  getRecentDocs(userId: string, limit?: number): Promise<Result<Doc[]>>;
  getDocById(userId: string, docId: string): Promise<Result<DocWithContent | null>>;
  createDocFromImport(
    userId: string,
    data: {
      title: string;
      sourceUrl: string;
      siteName: string | null;
      htmlContent: string;
      textContent: string;
      wordCount: number;
    },
  ): Promise<Result<Doc>>;
  createManualDoc(
    userId: string,
    data: { title: string; sourceUrl: string },
  ): Promise<Result<Doc>>;
}

export const docRepoKey = "docRepoKey";
