// app/api/connect/callback/google/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=google&error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=google&error=missing_code`
    );
  }

  let userId: string;
  try {
    userId = Buffer.from(state, "base64url").toString("utf8");
  } catch {
    return NextResponse redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=google&error=invalid_state`
    );
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/connect/callback/google`,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return NextResponse redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=google&error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`
    );
  }

  const infoRes = await fetch(
    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`
 );
  const info = await infoRes.json();

  const accountsRes = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );
  const accounts = await accountsRes.json();
  const account = accounts.accounts?.[0];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("platform_tokens").upsert(
    {
      user_id: userId,
      platform: "google",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      scopes: "https://www.googleapis.com/auth/business.manage",
      platform_user_id: info.id,
      platform_account_name: account?.accountName || info.name,
      metadata: { account_resource: account?.name },
    },
    { onConflict: "user_id,platform" }
  );

  return NextResponse redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=google&success=1`
  );
}