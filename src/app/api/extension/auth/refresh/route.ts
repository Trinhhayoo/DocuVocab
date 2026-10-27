import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type RefreshTokenRequestBody = Readonly<{
  refreshToken?: string;
}>;

export async function POST(request: Request) {
  let body: RefreshTokenRequestBody;

  try {
    body = (await request.json()) as RefreshTokenRequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        status: "400",
        message: "Invalid request body.",
      },
      { status: 400 },
    );
  }

  if (!body.refreshToken) {
    return NextResponse.json(
      {
        success: false,
        status: "400",
        message: "refreshToken is required.",
      },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: body.refreshToken,
  });

  if (error || !data.session) {
    return NextResponse.json(
      {
        success: false,
        status: "401",
        message: "Session expired. Please sign in again.",
      },
      { status: 401 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      status: "200",
      data: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    },
    { status: 200 },
  );
}
