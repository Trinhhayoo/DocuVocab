import PrismaDocRepository from "@/feature/core/doc/data/repository/prisma-doc.repository";
import PrismaSettingsRepository from "@/feature/core/settings/data/settings.repository";
import getSettingsUsecase from "@/feature/core/settings/domain/usecase/get-settings.usecase";
import PrismaVocabularyRepository from "@/feature/core/vocabulary/data/repository/prisma-vocabulary.repository";
import getRecentDocsUsecase from "@/feature/core/doc/domain/usecase/get-recent-docs.usecase";
import getDocByIdUsecase from "@/feature/core/doc/domain/usecase/get-doc-by-id.usecase";
import { requireCurrentUser } from "@/feature/core/user/domain/usecase/current-user";
import requireCurrentUserUsecase from "@/feature/core/user/domain/usecase/require-current-user.usecase";
import { normalizeWord } from "@/bootstrap/helpers/normalize-word.helper";

const docRepo = new PrismaDocRepository();
const settingsRepo = new PrismaSettingsRepository();
const vocabularyRepo = new PrismaVocabularyRepository();

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function appearsInContent(content: string, word: string) {
  const normalizedWord = normalizeWord(word);
  if (!normalizedWord) return false;

  const regex = new RegExp(`\\b${escapeRegExp(normalizedWord)}\\b`, "i");
  return regex.test(content);
}

export async function getRecentDocs() {
  const user = await requireCurrentUser();
  const result = user ? await getRecentDocsUsecase(docRepo, user.id) : null;

  if (!result || !result.success) {
    return [];
  }

  return result.data.map((doc) => doc.toPlainObject());
}

export async function getDocById(docId: string) {
  const user = await requireCurrentUserUsecase();
  const [docResult, settingsResult] = await Promise.all([
    getDocByIdUsecase(docRepo, user.id, docId),
    getSettingsUsecase(settingsRepo, user.id),
  ]);

  if (!docResult.success || !docResult.data) {
    return null;
  }

  const allowGlobalVocabulary =
    settingsResult.success && settingsResult.data.allowGlobalVocabulary;

  const vocabularyResult = allowGlobalVocabulary
    ? await vocabularyRepo.findByUserId(user.id)
    : await vocabularyRepo.findByDocOrSource(user.id, {
        docId,
        sourceUrl: docResult.data.doc.sourceUrl,
      });

  const currentDocumentText = (docResult.data.content?.textContent ?? "").toLowerCase();
  const uniqueWords = new Set<string>();

  const vocabularies =
    vocabularyResult.success
      ? vocabularyResult.data
          .filter((vocabulary) => {
            const normalizedWord = normalizeWord(vocabulary.word);

            if (!normalizedWord || uniqueWords.has(normalizedWord)) {
              return false;
            }

            if (
              allowGlobalVocabulary &&
              !appearsInContent(currentDocumentText, vocabulary.word)
            ) {
              return false;
            }

            uniqueWords.add(normalizedWord);
            return true;
          })
          .map((vocabulary) => ({
            id: vocabulary.id,
            word: vocabulary.word,
            meaning: vocabulary.meaning,
            note: vocabulary.note,
            originalSentence: vocabulary.originalSentence,
            exampleSentence: vocabulary.exampleSentence,
            status: vocabulary.status,
          }))
      : [];

  return {
    id: docResult.data.doc.id,
    title: docResult.data.doc.title,
    sourceUrl: docResult.data.doc.sourceUrl,
    siteName: docResult.data.doc.siteName,
    content: docResult.data.content
      ? docResult.data.content.toPlainObject()
      : null,
    vocabularies,
  };
}
