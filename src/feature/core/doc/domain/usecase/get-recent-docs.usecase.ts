import { Result } from "@/feature/common/data/result";
import Doc from "../entity/doc.entity";
import DocRepository from "../i-repo/doc.repository.interface";

export default async function getRecentDocsUsecase(
  repo: DocRepository,
  userId: string,
  limit?: number,
): Promise<Result<Doc[]>> {
  return repo.getRecentDocs(userId, limit);
}
