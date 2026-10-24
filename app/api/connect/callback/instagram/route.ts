// app/api/connect/callback/instagram/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=instagram&error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=instagram&error=missing_code`
    );
  }

  let userId: string;
  try {
    userId = Buffer.from(state, "base64url").toString("utf8");
  } catch {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=instagram&error=invalid_state`
    );
  }

  const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID!,
      client_secret: process.env.INSTAGRAM_APP_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/connect/callback/instagram`,
      code,
    }),
  });
  const tokenData = await tokenRes.json();

  if (tokenData.error_message || tokenData.error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=instagram&error=${encodeURIComponent(tokenData.error_message || tokenData.error)}`
    );
  }

  const accessToken = tokenData.access_token;
  const igUserId = tokenData.user_id;

  const profileRes = await fetch(
    `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
  );
  const profile = await profileRes.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("platform_tokens").upsert(
    {
      user_id: userId,
      platform: "instagram",
      access_token: accessToken,
      scopes: "user_profile,user_media",
      platform_user_id: igUserId,
      platform_account_name: profile.username ? `@${profile.username}` : undefined,
      metadata: { ig_user_id: igUserId },
    },
    { onConflict: "user_id,platform" }
  );

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=instagram&success=1`
  );
}