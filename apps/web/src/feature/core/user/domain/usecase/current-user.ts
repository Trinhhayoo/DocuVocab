import { createSupabaseServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

function getBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader) return null;

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function requireCurrentUser() {
    const supabase = await createSupabaseServerClient();
    const requestHeaders = await headers();
    const bearerToken = getBearerToken(requestHeaders.get("authorization"));

    const {
        data: { user },
        error,
    } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    return user;
}