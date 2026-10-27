import BaseFailure from "@/feature/common/failures/base.failure";

export default class DocImportFailure extends BaseFailure<{ url: string; error: unknown }> {
  constructor(metadata: { url: string; error: unknown }) {
    super("doc.import.failed", metadata);
  }
}
