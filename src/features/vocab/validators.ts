/**
 * Re-export domain params for client-side usage.
 * Single source of truth: feature/core/vocabulary/domain/params/
 */
export {
  createVocabularySchema,
  updateVocabularySchema,
  type CreateVocabularyInput,
  type UpdateVocabularyInput,
} from "@/feature/core/vocabulary/domain/params/vocabulary.param";