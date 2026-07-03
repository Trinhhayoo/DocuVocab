import type IHttpBoundary from "./i-http-boundary";
import type { HttpMethod, HttpRequestOptions } from "./i-http-boundary";
import {
  ClientResponseFailure,
  ServerResponseFailure,
  NetworkFailure,
} from "@/feature/common/failures/http.failure";

export default class HttpBoundary implements IHttpBoundary {
  async request<T = unknown>(
    url: string,
    method: HttpMethod,
    options?: HttpRequestOptions,
  ): Promise<T> {
    let response: Response;

    try {
      response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });
    } catch (error) {
      throw new NetworkFailure({ error });
    }

    const body = await response.json().catch(() => undefined);

    if (!response.ok) {
      const statusGroup = Math.floor(response.status / 100);
      if (statusGroup === 4) {
        throw new ClientResponseFailure({ status: response.status, body });
      }
      throw new ServerResponseFailure({ status: response.status, body });
    }

    return body as T;
  }

  async get<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>(url, "GET", options);
  }

  async post<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>(url, "POST", options);
  }

  async put<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>(url, "PUT", options);
  }

  async patch<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>(url, "PATCH", options);
  }

  async delete<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>(url, "DELETE", options);
  }
}
