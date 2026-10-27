import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
    async function signInWithGoogle() {
        "use server";

        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
            },
        });

        if (error) {
           throw new Error(`Sign-in failed: ${error.message}`);
        }

        redirect(data.url || "/");
    }

    return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="sr-only">Login</h1>
      <form action={signInWithGoogle}>
        <button className="rounded-xl bg-slate-900 px-5 py-3 text-white">
          Continue with Google
        </button>
      </form>
    </main>
  );
}