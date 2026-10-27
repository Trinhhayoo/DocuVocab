import IAuthUserRepository, { SyncAuthUserParams } from "../i-repo/i-auth-user.repository";


export default async function syncAuthUserUsecase(
  authUserRepo: IAuthUserRepository,
  params: SyncAuthUserParams,
): Promise<void> {
  await authUserRepo.syncUser({
    id: params.id,
    email: params.email,
  });
}