import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import PrismaAuthUserRepository from "@/feature/core/user/data/repository/auth-user.repository";
import syncAuthUserUsecase from "@/feature/core/user/domain/usecase/sync-auth-user.usecase";

const authUserRepo = new PrismaAuthUserRepository();

const EXTENSION_ID = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID!;

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);

    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/";

    if (!code) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session?.user) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    const user = data.session.user;

    await syncAuthUserUsecase(authUserRepo, {
        id: user.id,
        email: user.email ?? null,
    });

    const extensionCallbackUrl = new URL(
        `chrome-extension://${EXTENSION_ID}/auth-callback.html`,
    );

    extensionCallbackUrl.searchParams.set(
        "access_token",
        data.session.access_token,
    );

    extensionCallbackUrl.searchParams.set(
        "refresh_token",
        data.session.refresh_token,
    );

    extensionCallbackUrl.searchParams.set("next", next);

    const extensionRedirectUri = requestUrl.searchParams.get("redirect_uri");

    const callbackUrl = new URL(extensionRedirectUri!);
    callbackUrl.searchParams.set("access_token", data.session.access_token);
    callbackUrl.searchParams.set("refresh_token", data.session.refresh_token);
    callbackUrl.searchParams.set("next", next);

    return NextResponse.redirect(callbackUrl);
}