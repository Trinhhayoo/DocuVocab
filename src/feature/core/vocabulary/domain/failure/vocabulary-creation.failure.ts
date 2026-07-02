import BaseFailure from "@/feature/common/failures/base.failure";

export default class VocabularyCreationFailure extends BaseFailure<{ error: unknown }> {
  constructor(metadata?: { error: unknown }) {
    super("vocabulary.creation.failed", metadata);
  }
}
