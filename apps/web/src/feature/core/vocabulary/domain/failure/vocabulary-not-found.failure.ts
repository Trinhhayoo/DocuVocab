import BaseFailure from "@/feature/common/failures/base.failure";

export default class VocabularyNotFoundFailure extends BaseFailure<{ vocabId: string }> {
  constructor(metadata: { vocabId: string }) {
    super("vocabulary.notFound", metadata);
  }
}
