"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { settingsReturnPath, takePendingConnect } from "@/lib/openrouter-connect";

/** OpenRouter redirects here with `code` and `state` after the user approves DocuVocab. */
export default function OpenRouterCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  // React strict mode runs effects twice in development; the code can be exchanged only once.
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const pending = takePendingConnect(params.get("state"));

      if (!code || !pending) {
        setError("This connection link is invalid or expired. Start again from Settings.");
        return;
      }

      const response = await fetch("/api/settings/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, codeVerifier: pending.codeVerifier }),
      }).catch(() => null);
      const payload = await response?.json().catch(() => null);

      if (!response?.ok || !payload?.success) {
        setError(payload?.message ?? "Cannot connect your OpenRouter account. Please try again.");
        return;
      }

      window.location.replace(settingsReturnPath(pending.returnTo));
    })();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-lg font-semibold">
        {error ? "OpenRouter not connected" : "Connecting OpenRouter…"}
      </h1>
      {error && (
        <>
          <p className="max-w-md text-sm text-muted-foreground" role="alert">
            {error}
          </p>
          <Link href={settingsReturnPath("/")} className="text-sm underline">
            Back to DocuVocab
          </Link>
        </>
      )}
    </main>
  );
}
