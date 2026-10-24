// app/api/connect/callback/facebook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=facebook&error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=facebook&error=missing_code`
    );
  }

  let userId: string;
  try {
    userId = Buffer.from(state, "base64url").toString("utf8");
  } catch {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=facebook&error=invalid_state`
    );
  }

  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&redirect_uri=${process.env.NEXT_PUBLIC_SITE_URL}/api/connect/callback/facebook&code=${code}`
  );
  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=facebook&error=${encodeURIComponent(tokenData.error.message)}`
    );
  }

  const longRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
  );
  const longData = await longRes.json();
  const accessToken = longData.access_token || tokenData.access_token;

  const meRes = await fetch(
    `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${accessToken}`
  );
  const me = await meRes.json();

  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
  );
  const pages = await pagesRes.json();
  const page = pages.data?.[0];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("platform_tokens").upsert(
    {
      user_id: userId,
      platform: "facebook",
      access_token: accessToken,
      token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      scopes: "pages_show_list,pages_read_engagement,pages_manage_posts",
      platform_user_id: me.id,
      platform_account_name: page?.name || me.name,
      metadata: { page_id: page?.id, page_access_token: page?.access_token },
    },
    { onConflict: "user_id,platform" }
  );

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=facebook&success=1`
  );
}