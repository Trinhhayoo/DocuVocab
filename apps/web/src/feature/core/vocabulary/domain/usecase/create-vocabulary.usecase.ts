import { Result } from "@/feature/common/data/result";
import Vocabulary from "../entity/vocabulary.entity";
import VocabularyRepository from "../i-repo/vocabulary.repository.interface";
import { CreateVocabularyInput } from "../params/vocabulary.param";

export default async function createVocabularyUsecase(
  repo: VocabularyRepository,
  userId: string,
  input: CreateVocabularyInput,
): Promise<Result<Vocabulary>> {
  return repo.create(userId, input);
}
