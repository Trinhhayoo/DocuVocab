import type IBaseHttpResponse from "@/feature/common/data/http/i-base-http-response";
import Endpoint from "../endpoint";

type BackendApiResponse<DATA = unknown> =
  | { success: true; data: DATA; status?: string; message?: string }
  | { error: string };

export default class BackendEndpoint extends Endpoint {
  protected baseURL = "/api";
  protected apiVersion = "";

  protected toHttpDataResponse<DATA>(
    response: BackendApiResponse<DATA>,
  ): IBaseHttpResponse<DATA> {
    if ("error" in response) {
      return {
        success: false,
        status: "400",
        message: response.error,
      };
    }

    return {
      data: response.data,
      success: true,
      status: response.status ?? "200",
      message: response.message,
    };
  }

  // ── Doc endpoints ──

  get importUrl(): string {
    return this.buildEndpoint("import-url");
  }

  // ── Vocabulary endpoints ──

  get vocabularies(): string {
    return this.buildEndpoint("vocabularies");
  }

  vocabularyById(vocabId: string): string {
    return this.compose(this.vocabularies, vocabId);
  }
}
