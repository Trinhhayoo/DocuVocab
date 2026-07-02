import { Result } from "@/feature/common/data/result";
import Vocabulary from "../entity/vocabulary.entity";
import VocabularyRepository from "../i-repo/vocabulary.repository.interface";
import { UpdateVocabularyInput } from "../params/vocabulary.param";

export default async function updateVocabularyUsecase(
  repo: VocabularyRepository,
  userId: string,
  vocabId: string,
  input: UpdateVocabularyInput,
): Promise<Result<Vocabulary>> {
  return repo.update(userId, vocabId, input);
}
