import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
    async function signInWithGoogle() {
        "use server";

        const headerList = await headers();
        const forwardedHost = headerList.get("x-forwarded-host");
        const forwardedProto = headerList.get("x-forwarded-proto");
        const origin =
          forwardedProto && forwardedHost
            ? `${forwardedProto}://${forwardedHost}`
            : process.env.NEXT_PUBLIC_APP_URL!;

        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: new URL("/auth/callback", origin).toString(),
            },
        });

        if (error) {
           throw new Error(`Sign-in failed: ${error.message}`);
        }

        redirect(data.url || "/");
    }

    return (
    <main className="flex min-h-screen items-center justify-center">
      <form action={signInWithGoogle}>
        <button className="rounded-xl bg-slate-900 px-5 py-3 text-white">
          Continue with Google
        </button>
      </form>
    </main>
  );
}