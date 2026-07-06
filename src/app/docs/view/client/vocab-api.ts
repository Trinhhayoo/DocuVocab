import type {
  CreateVocabularyInput,
  UpdateVocabularyInput,
} from "@/feature/core/vocabulary/domain/params/vocabulary.param";
import type { ExplainVocabularyInput } from "@/feature/core/vocabulary/domain/params/explain-vocabulary.param";
import type { ExplainVocabularyResponse } from "@/feature/support/llm/llm-provider.interface";
import type IBaseHttpResponse from "@/feature/common/data/http/i-base-http-response";
import BaseHttpResponse from "@/feature/common/data/http/base-http-response";
import EndpointProvider from "@/bootstrap/endpoint/endpoint-provider";

export type VocabularyResponse = {
  vocabulary: {
    id: string;
    word: string;
    meaning: string | null;
    note: string | null;
    originalSentence: string | null;
    exampleSentence: string | null;
    status: string;
  };
};

const endpoint = EndpointProvider.backend;

export async function createVocabulary(
  input: CreateVocabularyInput,
): Promise<VocabularyResponse> {
  const raw = await endpoint.HttpBoundary.post<IBaseHttpResponse<VocabularyResponse>>(
    endpoint.vocabularies,
    { body: input },
  );

  return BaseHttpResponse.getHTTPResponseData(
    endpoint.toHttpResponse<VocabularyResponse>(raw),
  );
}

export async function updateVocabulary({
  vocabId,
  input,
}: {
  vocabId: string;
  input: UpdateVocabularyInput;
}): Promise<VocabularyResponse> {
  const raw = await endpoint.HttpBoundary.patch<IBaseHttpResponse<VocabularyResponse>>(
    endpoint.vocabularyById(vocabId),
    { body: input },
  );

  return BaseHttpResponse.getHTTPResponseData(
    endpoint.toHttpResponse<VocabularyResponse>(raw),
  );
}

export async function explainVocabulary(
  input: ExplainVocabularyInput,
): Promise<ExplainVocabularyResponse> {
  console.log("Calling explainVocabulary API with input:", input);
  const raw = await endpoint.HttpBoundary.post<
    IBaseHttpResponse<ExplainVocabularyResponse>
  >(endpoint.vocabularyExplain, { body: input });

  return BaseHttpResponse.getHTTPResponseData(
    endpoint.toHttpResponse<ExplainVocabularyResponse>(raw),
  );
}
