import BaseFailure from "./base.failure";

export default class ServerFailure extends BaseFailure<{ error: unknown }> {
  constructor(metadata?: { error: unknown }) {
    super("server.error", metadata);
  }
}
