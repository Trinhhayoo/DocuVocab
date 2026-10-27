'use client';

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default async function signOutUsecase() {
  const supabase = await createSupabaseBrowserClient();

  await supabase.auth.signOut();
}