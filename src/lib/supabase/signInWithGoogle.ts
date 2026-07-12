"use client";
import { redirect } from "next/navigation";
import { createSupabaseBrowserClient } from "./client";

export async function signInWithGoogle() {
    const origin = window.location.origin;
    const supabase = await createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: new URL("/auth/web/callback", origin).toString(),
        },
    });

    if (error) {
        throw new Error(`Sign-in failed: ${error.message}`);
    }

    redirect(data.url || "/");
}