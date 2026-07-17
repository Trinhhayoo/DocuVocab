import { NextResponse } from "next/server";

import PrismaSettingsRepository from "@/feature/core/settings/data/settings.repository";
import { updateSettingsSchema } from "@/feature/core/settings/domain/params/settings.params";
import getSettingsUsecase from "@/feature/core/settings/domain/usecase/get-settings.usecase";
import updateSettingsUsecase from "@/feature/core/settings/domain/usecase/update-settings.usecase";
import { requireCurrentUser } from "@/feature/core/user/domain/usecase/current-user";

const settingsRepo = new PrismaSettingsRepository();

export async function GET() {
  const user = await requireCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, status: "401", message: "Unauthorized" },
      { status: 401 },
    );
  }

  const result = await getSettingsUsecase(settingsRepo, user.id);

  if (!result.success) {
    return NextResponse.json(
      { success: false, status: "500", message: result.failure.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    status: "200",
    data: {
      settings: result.data,
    },
  });
}

export async function PATCH(request: Request) {
  const user = await requireCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, status: "401", message: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json();
  const parsed = updateSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, status: "400", message: "Invalid settings data." },
      { status: 400 },
    );
  }

  const result = await updateSettingsUsecase(settingsRepo, user.id, parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { success: false, status: "500", message: result.failure.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    status: "200",
    data: {
      settings: result.data,
    },
  });
}