import { prisma } from "@/bootstrap/configs/server/prisma.config";
import { Result, success, failure } from "@/feature/common/data/result";
import ServerFailure from "@/feature/common/failures/server.failure";
import VocabularyNotFoundFailure from "../../domain/failure/vocabulary-not-found.failure";
import VocabularyCreationFailure from "../../domain/failure/vocabulary-creation.failure";
import Vocabulary from "../../domain/entity/vocabulary.entity";
import VocabularyStatus from "../../domain/entity/enum/vocabulary-status.enum";
import type VocabularyRepository from "../../domain/i-repo/vocabulary.repository.interface";
import type { CreateVocabularyInput, UpdateVocabularyInput } from "../../domain/params/vocabulary.param";
import VocabularyMapper from "./vocabulary.mapper";

export default class PrismaVocabularyRepository implements VocabularyRepository {
  async create(
    userId: string,
    input: CreateVocabularyInput,
  ): Promise<Result<Vocabulary>> {
    try {
      const record = await prisma.vocabulary.create({
        data: {
          userId,
          docId: input.docId ?? null,
          sourceUrl: input.sourceUrl ?? null,
          sourceHostname: input.sourceHostname ?? null,
          pageTitle: input.pageTitle ?? null,
          word: input.word.trim(),
          meaning: input.meaning?.trim() ?? null,
          note: input.note?.trim() ?? null,
          originalSentence: input.originalSentence?.trim() ?? null,
          exampleSentence: input.exampleSentence?.trim() ?? null,
          status: VocabularyStatus.NEW,
        },
      });

      return success(VocabularyMapper.toEntity(record));
    } catch (error) {
      return failure(new VocabularyCreationFailure({ error }));
    }
  }

  async findByDocId(
    userId: string,
    docId: string,
  ): Promise<Result<Vocabulary[]>> {
    try {
      const records = await prisma.vocabulary.findMany({
        where: { userId, docId },
        orderBy: { createdAt: "desc" },
      });

      return success(VocabularyMapper.toEntityList(records));
    } catch (error) {
      return failure(new ServerFailure({ error }));
    }
  }

  async findBySource(
    userId: string,
    sourceUrl: string,
    sourceHostname: string,
  ): Promise<Result<Vocabulary[]>> {
    try {
      const records = await prisma.vocabulary.findMany({
        where: {
          userId,
          OR: [{ sourceUrl }, { sourceHostname }],
        },
        orderBy: { createdAt: "desc" },
      });

      return success(VocabularyMapper.toEntityList(records));
    } catch (error) {
      return failure(new ServerFailure({ error }));
    }
  }

  async update(
    userId: string,
    vocabId: string,
    input: UpdateVocabularyInput,
  ): Promise<Result<Vocabulary>> {
    try {
      const existing = await prisma.vocabulary.findFirst({
        where: { id: vocabId, userId },
      });

      if (!existing) {
        return failure(new VocabularyNotFoundFailure({ vocabId }));
      }

      const record = await prisma.vocabulary.update({
        where: { id: existing.id },
        data: {
          word: input.word?.trim(),
          meaning:
            input.meaning === undefined
              ? undefined
              : input.meaning?.trim() || null,
          note:
            input.note === undefined
              ? undefined
              : input.note?.trim() || null,
          originalSentence:
            input.originalSentence === undefined
              ? undefined
              : input.originalSentence?.trim() || null,
          exampleSentence:
            input.exampleSentence === undefined
              ? undefined
              : input.exampleSentence?.trim() || null,
          status: input.status,
        },
      });

      return success(VocabularyMapper.toEntity(record));
    } catch (error) {
      return failure(new ServerFailure({ error }));
    }
  }

  async delete(
    userId: string,
    vocabId: string,
  ): Promise<Result<void>> {
    try {
      const existing = await prisma.vocabulary.findFirst({
        where: { id: vocabId, userId },
      });

      if (!existing) {
        return failure(new VocabularyNotFoundFailure({ vocabId }));
      }

      await prisma.vocabulary.delete({ where: { id: existing.id } });

      return success(undefined);
    } catch (error) {
      return failure(new ServerFailure({ error }));
    }
  }
}