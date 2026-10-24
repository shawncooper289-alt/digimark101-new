// app/api/connect/callback/facebook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectRedirect, savePlatformConnection, siteOrigin, verifyOAuthState } from "@/lib/social/tokens";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const origin = siteOrigin(req);
  if (error) {
    return NextResponse.redirect(connectRedirect(origin, "facebook", { error }));
  }

  const userId = verifyOAuthState(state);
  if (!code || !userId) {
    return NextResponse.redirect(connectRedirect(origin, "facebook", { error: "missing_code" }));
  }

  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&redirect_uri=${encodeURIComponent(`${origin}/api/connect/callback/facebook`)}&code=${encodeURIComponent(code)}`
  );
  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return NextResponse.redirect(connectRedirect(origin, "facebook", { error: tokenData.error.message || "token" }));
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

  const saved = await savePlatformConnection({
    userId,
    platform: "facebook",
    accessToken,
    expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
    scopes: "pages_show_list,pages_read_engagement,pages_manage_posts",
    platformUserId: me.id,
    accountName: page?.name || me.name,
    extra: page?.access_token ? { page_access_token: page.access_token } : {},
    metadata: { page_id: page?.id || null },
  });
  if (!saved.ok) {
    return NextResponse.redirect(connectRedirect(origin, "facebook", { error: saved.error }));
  }

  return NextResponse.redirect(connectRedirect(origin, "facebook", { success: "1" }));
}