import VocabularyRepository from "../i-repo/vocabulary.repository.interface";
import { Result } from "@/feature/common/data/result";

export default async function deleteVocabularyUsecase(
  repo: VocabularyRepository,
  userId: string,
  vocabId: string,
): Promise<Result<void>> {
  return repo.delete(userId, vocabId);
}