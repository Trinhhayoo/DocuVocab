import { prisma } from "@/bootstrap/configs/server/prisma.config";
import IAuthUserRepository, { SyncAuthUserParams } from "../../domain/i-repo/i-auth-user.repository";

export default class PrismaAuthUserRepository implements IAuthUserRepository {
  async syncUser(params: SyncAuthUserParams): Promise<void> {
    await prisma.user.upsert({
      where: {
        id: params.id,
      },
      update: {
        email: params.email,
      },
      create: {
        id: params.id,
        email: params.email,
      },
    });
  }
}