import type IBaseHttpResponse from "./i-base-http-response";

export default class BaseHttpResponse {
  static toHTTPResponse<DATA>(
    response: IBaseHttpResponse<DATA>,
  ): IBaseHttpResponse<DATA> {
    if (!response.success) {
      throw new Error(response.message ?? "Request failed");
    }
    return response;
  }

  static getHTTPResponseData<DATA>(
    response: IBaseHttpResponse<DATA>,
  ): DATA {
    const validated = BaseHttpResponse.toHTTPResponse(response);
    if (validated.data === undefined) {
      throw new Error("Response data is missing");
    }
    return validated.data;
  }
}
