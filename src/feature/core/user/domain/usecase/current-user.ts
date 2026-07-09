import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireCurrentUser() {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }
    console.log("Current user:", user);
    return user;
}