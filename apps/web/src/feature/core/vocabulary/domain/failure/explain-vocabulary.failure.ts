import BaseFailure from "@/feature/common/failures/base.failure";

export default class ExplainVocabularyFailure extends BaseFailure<{ error: unknown }> {
  constructor(metadata?: { error: unknown }) {
    super("vocabulary.explain.failed", metadata);
  }
}
