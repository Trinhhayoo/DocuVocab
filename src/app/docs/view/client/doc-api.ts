import type { ImportUrlInput } from "@/feature/core/doc/domain/params/doc.param";
import type IBaseHttpResponse from "@/feature/common/data/http/i-base-http-response";
import BaseHttpResponse from "@/feature/common/data/http/base-http-response";
import EndpointProvider from "@/bootstrap/endpoint/endpoint-provider";

export type ImportUrlResponse = {
  docId: string;
};

const endpoint = EndpointProvider.backend;

export async function importUrl(input: ImportUrlInput): Promise<ImportUrlResponse> {
  const raw = await endpoint.HttpBoundary.post<IBaseHttpResponse<ImportUrlResponse>>(
    endpoint.importUrl,
    { body: input },
  );

  return BaseHttpResponse.getHTTPResponseData(
    endpoint.toHttpResponse<ImportUrlResponse>(raw),
  );
}
