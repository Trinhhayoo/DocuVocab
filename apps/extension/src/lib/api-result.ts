export type ApiFailure = Readonly<{ success: false; status: string; message: string }>;
export type ApiResult<T> = Readonly<{ success: true; data: T }> | ApiFailure;

export function ok<T>(data: T): ApiResult<T> {
  return { success: true, data };
}

export function fail(status: number | string, message: string): ApiFailure {
  return { success: false, status: String(status), message };
}

export function isUnauthorized(result: ApiResult<unknown>) {
  return !result.success && result.status === "401";
}

const MESSAGE_BY_STATUS: Readonly<Record<string, string>> = {
  "401": "Please sign in to continue.",
  "403": "You don't have permission to perform this action.",
  "404": "The requested resource was not found.",
  "429": "Too many requests. Please try again later.",
  "500": "Something went wrong on our server.",
};

/** Turns a failure into a message for the user; validation and conflict messages from the API pass through. */
export function toUserMessage(failure: ApiFailure) {
  if (failure.status === "400" || failure.status === "409") return failure.message;
  return MESSAGE_BY_STATUS[failure.status] ?? failure.message;
}
