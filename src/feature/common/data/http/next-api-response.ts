// src/feature/common/data/http/next-api-response.ts

import { NextResponse } from "next/server";
import type IBaseHttpResponse from "./i-base-http-response";
import type BaseFailure from "@/feature/common/failures/base.failure";

export function nextApiSuccess<DATA>(
  data: DATA,
  message = "OK",
  status = 200,
) {
  const body: IBaseHttpResponse<DATA> = {
    success: true,
    status: String(status),
    message,
    data,
  };

  return NextResponse.json(body, { status });
}

export function nextApiFailure(
  failure: BaseFailure<unknown>,
  status = 500,
  message?: string,
) {
  const body: IBaseHttpResponse = {
    success: false,
    status: String(status),
    message: message ?? failure.message,
  };

  return NextResponse.json(body, { status });
}

export function nextApiUnauthorized(message = "Please log in first.") {
  const body: IBaseHttpResponse = {
    success: false,
    status: "401",
    message,
  };

  return NextResponse.json(body, { status: 401 });
}

export function nextApiValidationError(details?: unknown) {
  const body: IBaseHttpResponse = {
    success: false,
    status: "400",
    message: "Invalid request data",
    data: details,
  };

  return NextResponse.json(body, { status: 400 });
}