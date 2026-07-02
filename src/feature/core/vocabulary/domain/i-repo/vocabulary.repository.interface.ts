import { Result } from "@/feature/common/data/result";
import Vocabulary from "../entity/vocabulary.entity";
import { CreateVocabularyInput, UpdateVocabularyInput } from "../params/vocabulary.param";

export default interface VocabularyRepository {
  findByDocId(userId: string, docId: string): Promise<Result<Vocabulary[]>>;
  findBySource(
    userId: string,
    sourceUrl: string,
    sourceHostname: string,
  ): Promise<Result<Vocabulary[]>>;
  create(userId: string, input: CreateVocabularyInput): Promise<Result<Vocabulary>>;
  update(
    userId: string,
    vocabId: string,
    input: UpdateVocabularyInput,
  ): Promise<Result<Vocabulary>>;
  delete(userId: string, vocabId: string): Promise<Result<void>>;
}

export const vocabularyRepoKey = "vocabularyRepoKey";
