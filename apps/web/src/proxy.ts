import { NextResponse, type NextRequest } from "next/server";

const EXTENSION_ORIGIN_PATTERN =
  /^(chrome-extension|moz-extension|safari-web-extension):\/\/[a-z0-9-]+$/i;

const CORS_OPTIONS = {
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  Vary: "Origin",
};

/** Allows cross-origin calls to the extension API from browser-extension origins only. */
export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const corsHeaders: Record<string, string> = EXTENSION_ORIGIN_PATTERN.test(origin)
    ? { ...CORS_OPTIONS, "Access-Control-Allow-Origin": origin }
    : CORS_OPTIONS;

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const response = NextResponse.next();

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: "/api/extension/:path*",
};
