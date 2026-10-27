import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function requireCurrentUserUsecase() {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error || !user) {
        redirect("/");
    }

    return user;

}

