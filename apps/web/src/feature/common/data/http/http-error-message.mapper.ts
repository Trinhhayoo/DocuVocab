// src/feature/common/data/http/http-error-message.mapper.ts

import {
  ClientResponseFailure,
  NetworkFailure,
  ResponseStructureFailure,
  ServerResponseFailure,
} from "@/feature/common/failures/http.failure";

type ApiErrorBody = {
  success?: boolean;
  status?: string;
  message?: string;
  data?: unknown;
};

function getApiMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;

  const apiBody = body as ApiErrorBody;

  if (typeof apiBody.message === "string" && apiBody.message.trim()) {
    return apiBody.message;
  }

  return null;
}

export function mapHttpErrorToMessage(error: unknown): string {
  if (error instanceof ClientResponseFailure) {
    const status = error.metadata?.status;
    const apiMessage = getApiMessage(error.metadata?.body);

    if (status === 401) {
      return apiMessage ?? "Please log in before using this feature.";
    }

    if (status === 403) {
      return apiMessage ?? "You do not have permission to do this.";
    }

    if (status === 400) {
      return apiMessage ?? "Please check your input and try again.";
    }

    if (status === 404) {
      return apiMessage ?? "The requested resource was not found.";
    }

    return apiMessage ?? "Something went wrong with your request.";
  }

  if (error instanceof ServerResponseFailure) {
    const apiMessage = getApiMessage(error.metadata?.body);
    return apiMessage ?? "The server had a problem. Please try again later.";
  }

  if (error instanceof NetworkFailure) {
    return "Cannot connect to the server. Please check your internet connection.";
  }

  if (error instanceof ResponseStructureFailure) {
    return "The server returned an unexpected response.";
  }

  if (error instanceof Error) {
    if (error.message === "http.clientError") {
      return "Please log in before using this feature.";
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
}