import { Result } from "@/feature/common/data/result";
import Vocabulary from "../entity/vocabulary.entity";
import VocabularyRepository from "../i-repo/vocabulary.repository.interface";

export default async function getVocabulariesByDocUsecase(
  repo: VocabularyRepository,
  userId: string,
  docId: string,
): Promise<Result<Vocabulary[]>> {
  return repo.findByDocId(userId, docId);
}
