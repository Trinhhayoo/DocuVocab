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

  // The identity API opens this page as a navigation, which sends no Origin header; the request URL
  // is always the host serving it, locally and on every Vercel deployment.
  const callbackUrl = new URL("/auth/extension/callback", requestUrl.origin);
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
