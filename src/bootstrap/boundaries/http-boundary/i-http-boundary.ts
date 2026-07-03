export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpRequestOptions = {
  headers?: Record<string, string>;
  body?: unknown;
};

export default interface IHttpBoundary {
  request<T = unknown>(
    url: string,
    method: HttpMethod,
    options?: HttpRequestOptions,
  ): Promise<T>;

  get<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T>;
  post<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T>;
  put<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T>;
  patch<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T>;
  delete<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T>;
}
