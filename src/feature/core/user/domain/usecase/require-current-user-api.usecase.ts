import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { failure, type Result, success } from "@/feature/common/data/result";
import UnauthorizedFailure from "../failure/unauthorized.failure";

export default async function requireCurrentUserApiUsecase(): Promise<Result<User>> {
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