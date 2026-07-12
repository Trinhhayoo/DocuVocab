import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") ?? "/";
  const redirectUri = requestUrl.searchParams.get("redirect_uri");
  const headerList = await headers();
  const forwardedHost = headerList.get("x-forwarded-host");
  const forwardedProto = headerList.get("x-forwarded-proto");
  const origin =
    forwardedProto && forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : requestUrl.origin || process.env.NEXT_PUBLIC_APP_URL!;

  const callbackUrl = new URL(`${origin}/auth/extension/callback`);
  callbackUrl.searchParams.set("next", next);
  callbackUrl.searchParams.set("redirect_uri", redirectUri!);

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    redirect("/");
  }

  redirect(data.url);
}