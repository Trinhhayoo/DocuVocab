import { execFileSync } from "node:child_process";
import path from "node:path";

export type LocalSupabase = Readonly<{
  apiUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  dbUrl: string;
}>;

const APP_ROOT = path.resolve(__dirname, "../..");
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

function assertLocal(name: string, value: string) {
  const { hostname } = new URL(value);
  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(`${name} must point at the local Supabase stack, got host "${hostname}".`);
  }
}

function readString(status: Record<string, unknown>, key: string) {
  const value = status[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`\`supabase status\` did not report ${key}. Run \`pnpm e2e:db\` first.`);
  }
  return value;
}

/**
 * Reads the local stack started by `pnpm e2e:db`. Every e2e step goes through this, so tests can
 * never seed or sign in against the hosted Supabase project.
 */
export function readLocalSupabase(): LocalSupabase {
  const raw = execFileSync("pnpm", ["exec", "supabase", "status", "-o", "json"], {
    cwd: APP_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  const status: Record<string, unknown> = JSON.parse(raw);

  const local = {
    apiUrl: readString(status, "API_URL"),
    anonKey: readString(status, "ANON_KEY"),
    serviceRoleKey: readString(status, "SERVICE_ROLE_KEY"),
    dbUrl: readString(status, "DB_URL"),
  };

  assertLocal("API_URL", local.apiUrl);
  assertLocal("DB_URL", local.dbUrl);
  return local;
}

/** Environment for the app under test and for Prisma, overriding anything in `.env`. */
export function appEnv(local: LocalSupabase): Record<string, string> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: local.apiUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.anonKey,
    DATABASE_URL: local.dbUrl,
    DIRECT_URL: local.dbUrl,
    // Explanations are mocked in the browser. An unknown provider makes any unmocked call fail
    // before a network request, so tests never reach Ollama with the developer's real key.
    LLM_PROVIDER: "disabled-in-e2e",
  };
}
