// app/api/connect/callback/tiktok/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=tiktok&error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=tiktok&error=missing_code`
    );
  }

  let userId: string;
  try {
    userId = Buffer.from(state, "base64url").toString("utf8");
  } catch {
    return NextResponse redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=tiktok&error=invalid_state`
    );
  }

  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/connect/callback/tiktok`,
    }),
  });
  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return NextResponse redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=tiktok&error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`
    );
  }

  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  const expiresIn = tokenData.expires_in;

  const fields = "open_id,union_id,avatar_url,display_name";
  const fieldsParam = crypto
    .createHash("sha256")
    .update(fields)
    .digest("hex");

  const profileRes = await fetch(
    `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const profileData = await profileRes.json();
  const profile = profileData.data?.user;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("platform_tokens").upsert(
    {
      user_id: userId,
      platform: "tiktok",
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: expiresIn
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null,
      scopes: "user.info.basic,video.list,video.upload",
      platform_user_id: profile?.open_id,
      platform_account_name: profile?.display_name,
      metadata: { union_id: profile?.union_id, avatar_url: profile?.avatar_url },
    },
    { onConflict: "user_id,platform" }
  );

  return NextResponse redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=tiktok&success=1`
  );
}