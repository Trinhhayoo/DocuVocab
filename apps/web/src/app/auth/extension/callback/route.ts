import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
    EXTENSION_CALLBACK_PATH,
    EXTENSION_REDIRECT_COOKIE,
    parseExtensionRedirectUri,
} from "@/lib/extension-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PrismaAuthUserRepository from "@/feature/core/user/data/repository/auth-user.repository";
import syncAuthUserUsecase from "@/feature/core/user/domain/usecase/sync-auth-user.usecase";

const authUserRepo = new PrismaAuthUserRepository();

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);

    const code = requestUrl.searchParams.get("code");
    const cookieStore = await cookies();
    // Re-validated here: the cookie came from the login route, but cookies are client input.
    const callbackUrl = parseExtensionRedirectUri(
        cookieStore.get(EXTENSION_REDIRECT_COOKIE)?.value ?? null,
    );
    cookieStore.delete({ name: EXTENSION_REDIRECT_COOKIE, path: EXTENSION_CALLBACK_PATH });

    // Validate before exchanging the code so tokens are never minted for a foreign redirect.
    if (!code || !callbackUrl) {
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

    callbackUrl.searchParams.set("access_token", data.session.access_token);
    callbackUrl.searchParams.set("refresh_token", data.session.refresh_token);

    return NextResponse.redirect(callbackUrl);
}
