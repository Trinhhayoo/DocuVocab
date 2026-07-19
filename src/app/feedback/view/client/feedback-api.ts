import EndpointProvider from "@/bootstrap/endpoint/endpoint-provider";
import BaseHttpResponse from "@/feature/common/data/http/base-http-response";
import type IBaseHttpResponse from "@/feature/common/data/http/i-base-http-response";
import type { FeedbackDto } from "@/feature/core/feedback/data/repository/feedback.dto";
import type { CreateFeedbackInput } from "@/feature/core/feedback/domain/params/feedback.param";

export type FeedbackResponse = {
  feedback: FeedbackDto;
};

const endpoint = EndpointProvider.backend;

export async function submitFeedback(
  input: CreateFeedbackInput,
): Promise<FeedbackResponse> {
  const raw = await endpoint.HttpBoundary.post<IBaseHttpResponse<FeedbackResponse>>(
    endpoint.feedback,
    { body: input },
  );

  return BaseHttpResponse.getHTTPResponseData(
    endpoint.toHttpResponse<FeedbackResponse>(raw),
  );
}