// src/feature/core/user/domain/usecase/require-current-user-api.usecase.ts

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { failure, Result, success } from "@/feature/common/data/result";
import UnauthorizedFailure from "../failure/unauthorized.failure";
import type { User } from "@supabase/supabase-js";

export default async function requireCurrentUserApiUsecase(): Promise<Result<User>> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return failure(new UnauthorizedFailure());
  }

  return success<User>(user);
}