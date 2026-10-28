import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/safe-next-path";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** The only place the web app starts Google sign-in; the header button and /login both link here. */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  // The request URL is always the host serving it, locally and on every Vercel deployment.
  const callbackUrl = new URL("/auth/web/callback", requestUrl.origin);
  callbackUrl.searchParams.set("next", next);

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
