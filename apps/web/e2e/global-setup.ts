import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { AUTH_DIR, E2E_USER, FIXTURES_PATH, type SeededIds, STORAGE_STATE_PATH } from "./support/fixtures";
import { readLocalSupabase } from "./support/local-supabase";
import { seedDatabase } from "./support/seed";

const APP_ROOT = path.resolve(__dirname, "..");
const APP_HOST = "localhost";

type CookieToSet = { name: string; value: string };

/** Applies migrations, recreates the e2e user and its data, and saves a signed-in browser state. */
export default async function globalSetup() {
  const local = readLocalSupabase();

  execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
    cwd: APP_ROOT,
    env: { ...process.env, DATABASE_URL: local.dbUrl, DIRECT_URL: local.dbUrl },
    stdio: "ignore",
  });

  const admin = createClient(local.apiUrl, local.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing } = await admin.auth.admin.listUsers();
  for (const user of existing.users.filter(({ email }) => email === E2E_USER.email)) {
    await admin.auth.admin.deleteUser(user.id);
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    ...E2E_USER,
    email_confirm: true,
  });
  if (createError || !created.user) throw createError ?? new Error("Could not create the e2e user.");

  // The OAuth callback normally creates the app's User row; password sign-in skips it.
  const { docId } = await seedDatabase(local.dbUrl, { id: created.user.id, email: E2E_USER.email });

  // Sign in through @supabase/ssr so the cookies match exactly what the app reads.
  const cookies = new Map<string, CookieToSet>();
  const supabase = createServerClient(local.apiUrl, local.anonKey, {
    cookies: {
      getAll: () => [...cookies.values()],
      setAll: (toSet) => toSet.forEach((cookie) => cookies.set(cookie.name, cookie)),
    },
  });
  const { error: signInError } = await supabase.auth.signInWithPassword(E2E_USER);
  if (signInError) throw signInError;

  mkdirSync(AUTH_DIR, { recursive: true });
  writeFileSync(
    STORAGE_STATE_PATH,
    JSON.stringify({
      cookies: [...cookies.values()].map(({ name, value }) => ({
        name,
        value,
        domain: APP_HOST,
        path: "/",
        expires: -1,
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      })),
      origins: [],
    }),
  );
  writeFileSync(FIXTURES_PATH, JSON.stringify({ userId: created.user.id, docId } satisfies SeededIds));
}
