import { NextResponse } from "next/server";

import PrismaSettingsRepository from "@/feature/core/settings/data/settings.repository";
import { updateSettingsSchema } from "@/feature/core/settings/domain/params/settings.params";
import getSettingsUsecase from "@/feature/core/settings/domain/usecase/get-settings.usecase";
import updateSettingsUsecase from "@/feature/core/settings/domain/usecase/update-settings.usecase";
import { requireCurrentUser } from "@/feature/core/user/domain/usecase/current-user";

const settingsRepo = new PrismaSettingsRepository();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const user = await requireCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, status: "401", message: "Unauthorized" },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  const result = await getSettingsUsecase(settingsRepo, user.id);

  if (!result.success) {
    return NextResponse.json(
      { success: false, status: "500", message: result.failure.message },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    {
      success: true,
      status: "200",
      data: {
        settings: result.data,
      },
    },
    { headers: CORS_HEADERS },
  );
}

export async function PATCH(request: Request) {
  const user = await requireCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, status: "401", message: "Unauthorized" },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  const body = await request.json();
  const parsed = updateSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, status: "400", message: "Invalid settings data." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const result = await updateSettingsUsecase(settingsRepo, user.id, parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { success: false, status: "500", message: result.failure.message },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    {
      success: true,
      status: "200",
      data: {
        settings: result.data,
      },
    },
    { headers: CORS_HEADERS },
  );
}
