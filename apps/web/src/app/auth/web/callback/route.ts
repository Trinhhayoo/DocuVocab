import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { safeNextPath } from "@/lib/safe-next-path";
import { RETURN_PATH_COOKIE, WEB_CALLBACK_PATH } from "@/lib/sign-in-return-path";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PrismaAuthUserRepository from "@/feature/core/user/data/repository/auth-user.repository";
import syncAuthUserUsecase from "@/feature/core/user/domain/usecase/sync-auth-user.usecase";

const authUserRepo = new PrismaAuthUserRepository();

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const cookieStore = await cookies();
  const next = safeNextPath(cookieStore.get(RETURN_PATH_COOKIE)?.value ?? null);
  cookieStore.delete({ name: RETURN_PATH_COOKIE, path: WEB_CALLBACK_PATH });

  if (!code) {
    return NextResponse.json(
      {
        success: false,
        status: "400",
        message: "Missing code parameter.",
      },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  //https://supabase.com/docs/guides/auth/server-side/advanced-guide
  // It automatically store cookies in requests' header.
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session?.user) {
    return NextResponse.json(
      {
        success: false,
        status: "401",
        message: "Failed to complete Google login.",
      },
      { status: 401 },
    );
  }

  const user = data.session.user;

  await syncAuthUserUsecase(authUserRepo, {
    id: user.id,
    email: user.email ?? null,
  });

  return NextResponse.redirect(new URL(next, request.url));
}