import BaseFailure from "../failures/base.failure";

/**
 * Result type: a simplified Either-like type for handling success/failure.
 * Left = failure, Right = success (follows fp-ts convention).
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; failure: BaseFailure<unknown> };

export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

export function failure<T>(fail: BaseFailure<unknown>): Result<T> {
  return { success: false, failure: fail };
}

export function isSuccess<T>(result: Result<T>): result is { success: true; data: T } {
  return result.success;
}

export function isFailure<T>(
  result: Result<T>,
): result is { success: false; failure: BaseFailure<unknown> } {
  return !result.success;
}
