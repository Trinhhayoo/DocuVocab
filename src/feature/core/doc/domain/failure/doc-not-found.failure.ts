import BaseFailure from "@/feature/common/failures/base.failure";

export default class DocNotFoundFailure extends BaseFailure<{ docId: string }> {
  constructor(metadata: { docId: string }) {
    super("doc.notFound", metadata);
  }
}
