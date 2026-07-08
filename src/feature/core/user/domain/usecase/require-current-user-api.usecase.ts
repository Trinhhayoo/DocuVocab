// src/feature/core/user/domain/usecase/require-current-user-api.usecase.ts

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { failure, success } from "@/feature/common/data/result";
import UnauthorizedFailure from "../failure/unauthorized.failure";

export default async function requireCurrentUserApiUsecase() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return failure(new UnauthorizedFailure());
  }

  return success(user);
}