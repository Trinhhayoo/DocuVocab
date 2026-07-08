"use client";
import { redirect } from "next/navigation";
import { createSupabaseBrowserClient } from "./client";

export async function signInWithGoogle() {

    const supabase = await createSupabaseBrowserClient();
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