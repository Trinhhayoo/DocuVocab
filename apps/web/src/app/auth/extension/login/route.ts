import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import {
  EXTENSION_CALLBACK_PATH,
  EXTENSION_REDIRECT_COOKIE,
  extensionRedirectCookieOptions,
  parseExtensionRedirectUri,
} from "@/lib/extension-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
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
  const callbackUrl = new URL(EXTENSION_CALLBACK_PATH, requestUrl.origin);

  (await cookies()).set(
    EXTENSION_REDIRECT_COOKIE,
    redirectUri.href,
    extensionRedirectCookieOptions(requestUrl.protocol === "https:"),
  );

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
