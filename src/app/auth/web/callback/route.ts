import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import PrismaAuthUserRepository from "@/feature/core/user/data/repository/auth-user.repository";
import syncAuthUserUsecase from "@/feature/core/user/domain/usecase/sync-auth-user.usecase";

const authUserRepo = new PrismaAuthUserRepository();

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

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