/**
 * Base class for all domain failures.
 * Extend this class to create specific failure types per domain.
 *
 * Usage:
 *   class VocabularyNotFoundFailure extends BaseFailure<{ vocabId: string }> {
 *     constructor(metadata: { vocabId: string }) {
 *       super("vocabulary.notFound", metadata);
 *     }
 *   }
 */
export default abstract class BaseFailure<META_DATA = undefined> {
  message: string;
  metadata: META_DATA | undefined;

  constructor(message: string, metadata?: META_DATA) {
    this.message = message;
    this.metadata = metadata ?? undefined;
  }

  toPlainObject(): { message: string; metadata: META_DATA | undefined } {
    return {
      message: this.message,
      metadata: this.metadata,
    };
  }
}
