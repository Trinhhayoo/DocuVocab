import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PrismaAuthUserRepository from "@/feature/core/user/data/repository/auth-user.repository";
import syncAuthUserUsecase from "@/feature/core/user/domain/usecase/sync-auth-user.usecase";

const authUserRepo = new PrismaAuthUserRepository();

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);

    const code = requestUrl.searchParams.get("code");

    if (!code) {
        return NextResponse.json(
            { success: false, status: "400", message: "Missing code parameter." },
            { status: 400 },
        );
    }

    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await syncAuthUserUsecase(authUserRepo, {
        id: user.id,
        email: user.email ?? null,
      });
    }
    
    return NextResponse.redirect(new URL("/", request.url));
}