import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { parseExtensionRedirectUri } from "@/lib/extension-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") ?? "/";
  const redirectUri = parseExtensionRedirectUri(
    requestUrl.searchParams.get("redirect_uri"),
  );

  if (!redirectUri) {
    return NextResponse.json(
      { message: "Invalid extension redirect URI." },
      { status: 400 },
    );
  }

  const origin =
    (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL!;

  const callbackUrl = new URL(`${origin}/auth/extension/callback`);
  callbackUrl.searchParams.set("next", next);
  callbackUrl.searchParams.set("redirect_uri", redirectUri.href);

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    redirect("/");
  }

  redirect(data.url);
}
