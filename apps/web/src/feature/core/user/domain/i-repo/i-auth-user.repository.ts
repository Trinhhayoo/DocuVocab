export type SyncAuthUserParams = {
  id: string;
  email: string | null;
};

export default interface IAuthUserRepository {
  syncUser(params: SyncAuthUserParams): Promise<void>;
}