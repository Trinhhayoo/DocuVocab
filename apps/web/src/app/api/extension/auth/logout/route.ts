import { NextResponse } from "next/server";

import type IBaseHttpResponse from "@/feature/common/data/http/i-base-http-response";
import {
  nextApiSuccess,
  nextApiUnauthorized,
} from "@/feature/common/data/http/next-api-response";
import { getBearerToken } from "@/feature/core/user/domain/usecase/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/extension/auth/logout
 * Revokes the extension's session (scope `local`), so its refresh token stops working
 * and the user's other sessions stay signed in.
 */
export async function POST(request: Request) {
  const accessToken = getBearerToken(request.headers.get("authorization"));

  if (!accessToken) {
    return nextApiUnauthorized();
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.admin.signOut(accessToken, "local");

  if (error) {
    const status = error.status ?? 500;
    const body: IBaseHttpResponse = {
      success: false,
      status: String(status),
      message: "Cannot revoke the session.",
    };

    return NextResponse.json(body, { status });
  }

  return nextApiSuccess(null);
}
