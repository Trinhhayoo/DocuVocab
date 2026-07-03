import type IBaseHttpResponse from "@/feature/common/data/http/i-base-http-response";
import type IHttpBoundary from "@/bootstrap/boundaries/http-boundary/i-http-boundary";
import HttpBoundary from "@/bootstrap/boundaries/http-boundary/http-boundary";
import { ResponseStructureFailure } from "@/feature/common/failures/http.failure";

export default abstract class Endpoint {
  protected abstract baseURL: string;
  protected abstract apiVersion: string;

  protected abstract toHttpDataResponse<DATA>(
    response: unknown,
  ): IBaseHttpResponse<DATA>;

  get HttpBoundary(): IHttpBoundary {
    return new HttpBoundary();
  }

  toHttpResponse<DATA>(response: unknown): IBaseHttpResponse<DATA> {
    try {
      return this.toHttpDataResponse<DATA>(response);
    } catch (error) {
      throw new ResponseStructureFailure({ error });
    }
  }

  protected buildEndpoint(...segments: string[]): string {
    const parts = [this.baseURL, this.apiVersion, ...segments].filter(Boolean);
    return this.sanitizeURL(parts.join("/"));
  }

  protected compose(base: string, ...segments: string[]): string {
    return this.sanitizeURL([base, ...segments].join("/"));
  }

  private sanitizeURL(url: string): string {
    return url.replace(/([^:]\/)\/+/g, "$1");
  }
}
