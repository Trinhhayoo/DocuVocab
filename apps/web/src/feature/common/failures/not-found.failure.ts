import BaseFailure from "./base.failure";

export default class NotFoundFailure extends BaseFailure<{ resource: string; id?: string }> {
  constructor(metadata: { resource: string; id?: string }) {
    super("notFound", metadata);
  }
}
