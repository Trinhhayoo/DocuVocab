// src/feature/core/user/domain/failure/unauthorized.failure.ts

import BaseFailure from "@/feature/common/failures/base.failure";

export default class UnauthorizedFailure extends BaseFailure<undefined> {
  override message = "Please log in before using this feature.";

  constructor() {
    super("auth.unauthorized");
  }
}