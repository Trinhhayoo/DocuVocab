import { Result } from "@/feature/common/data/result";
import DocRepository, { DocWithContent } from "../i-repo/doc.repository.interface";

export default async function getDocByIdUsecase(
  repo: DocRepository,
  userId: string,
  docId: string,
): Promise<Result<DocWithContent | null>> {
  return repo.getDocById(userId, docId);
}
