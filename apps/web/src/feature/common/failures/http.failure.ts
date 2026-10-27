import BaseFailure from "@/feature/common/failures/base.failure";

export class ClientResponseFailure extends BaseFailure<{
  status: number;
  body?: unknown;
}> {
  constructor(metadata: { status: number; body?: unknown }) {
    super("http.clientError", metadata);
  }
}

export class ServerResponseFailure extends BaseFailure<{
  status: number;
  body?: unknown;
}> {
  constructor(metadata: { status: number; body?: unknown }) {
    super("http.serverError", metadata);
  }
}

export class NetworkFailure extends BaseFailure<{ error: unknown }> {
  constructor(metadata: { error: unknown }) {
    super("http.networkError", metadata);
  }
}

export class ResponseStructureFailure extends BaseFailure<{
  error: unknown;
}> {
  constructor(metadata: { error: unknown }) {
    super("http.responseStructure", metadata);
  }
}
