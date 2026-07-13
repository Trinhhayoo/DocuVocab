import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") ?? "/";
  const origin = requestUrl.origin || process.env.NEXT_PUBLIC_APP_URL!;

  const callbackUrl = new URL(`${origin}/auth/web/callback`);
  callbackUrl.searchParams.set("next", next);

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