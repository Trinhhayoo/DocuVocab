import Vocabulary from "../../domain/entity/vocabulary.entity";
import VocabularyStatus from "../../domain/entity/enum/vocabulary-status.enum";
import type { VocabularyDto } from "./vocabulary.dto";
import type { Vocabulary as PrismaVocabulary } from "@/generated/prisma/client";

export default class VocabularyMapper {
  static toEntity(record: PrismaVocabulary): Vocabulary {
    return new Vocabulary({
      id: record.id,
      userId: record.userId,
      docId: record.docId,
      sourceUrl: record.sourceUrl,
      sourceHostname: record.sourceHostname,
      pageTitle: record.pageTitle,
      word: record.word,
      meaning: record.meaning,
      note: record.note,
      originalSentence: record.originalSentence,
      exampleSentence: record.exampleSentence,
      status: (record.status as VocabularyStatus) ?? VocabularyStatus.NEW,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toEntityList(records: PrismaVocabulary[]): Vocabulary[] {
    return records.map(VocabularyMapper.toEntity);
  }

  static toDto(entity: Vocabulary): VocabularyDto {
    return {
      id: entity.id,
      docId: entity.docId,
      sourceUrl: entity.sourceUrl,
      sourceHostname: entity.sourceHostname,
      pageTitle: entity.pageTitle,
      word: entity.word,
      meaning: entity.meaning,
      note: entity.note,
      originalSentence: entity.originalSentence,
      exampleSentence: entity.exampleSentence,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}