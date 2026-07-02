import BaseFailure from "./base.failure";

export default class ValidationFailure extends BaseFailure<Record<string, string[]>> {
  constructor(metadata?: Record<string, string[]>) {
    super("validation.failed", metadata);
  }
}
