import EndpointProvider from "@/bootstrap/endpoint/endpoint-provider";
import BaseHttpResponse from "@/feature/common/data/http/base-http-response";
import type IBaseHttpResponse from "@/feature/common/data/http/i-base-http-response";
import type { Settings } from "@/feature/core/settings/domain/entity/settings.entity";
import type { UpdateSettings } from "@/feature/core/settings/domain/params/settings.params";

type SettingsResponse = {
  settings: Settings;
};

const endpoint = EndpointProvider.backend;

export async function getSettings(): Promise<SettingsResponse> {
  const raw = await endpoint.HttpBoundary.get<IBaseHttpResponse<SettingsResponse>>(
    endpoint.settings,
  );

  return BaseHttpResponse.getHTTPResponseData(
    endpoint.toHttpResponse<SettingsResponse>(raw),
  );
}

export async function updateSettings(
  input: UpdateSettings,
): Promise<SettingsResponse> {
  const raw = await endpoint.HttpBoundary.patch<IBaseHttpResponse<SettingsResponse>>(
    endpoint.settings,
    { body: input },
  );

  return BaseHttpResponse.getHTTPResponseData(
    endpoint.toHttpResponse<SettingsResponse>(raw),
  );
}