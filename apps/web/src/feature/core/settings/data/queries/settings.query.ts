import { prisma } from "@/bootstrap/configs/server/prisma.config";
import type { UserSetting } from "@/generated/prisma/client";

import type { UpdateSettings } from "../../domain/params/settings.params";

export async function getSettingsByUserIdQuery(
  userId: string,
): Promise<UserSetting | null> {
  return prisma.userSetting.findUnique({
    where: { userId },
  });
}

/** Undefined fields are left unchanged on update and take the column default on create. */
export async function upsertSettingsByUserIdQuery(
  userId: string,
  input: UpdateSettings & { openRouterKeyEncrypted?: string | null },
): Promise<UserSetting> {
  return prisma.userSetting.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
}
