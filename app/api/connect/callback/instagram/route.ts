import { NextRequest, NextResponse } from "next/server"
import { connectRedirect, savePlatformConnection, siteOrigin, verifyOAuthState } from "@/lib/social/tokens"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const origin = siteOrigin(req)
  if (error) return NextResponse.redirect(connectRedirect(origin, "instagram", { error }))
  const userId = verifyOAuthState(searchParams.get("state"))
  if (!code || !userId) return NextResponse.redirect(connectRedirect(origin, "instagram", { error: "missing_code" }))

  const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID || "",
      client_secret: process.env.INSTAGRAM_APP_SECRET || "",
      grant_type: "authorization_code",
      redirect_uri: `${origin}/api/connect/callback/instagram`,
      code,
    }),
  })
  const tokenData = await tokenRes.json()
  if (tokenData.error_message || tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(connectRedirect(origin, "instagram", { error: tokenData.error_message || tokenData.error || "token" }))
  }
  const profileRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(tokenData.access_token)}`)
  const profile = await profileRes.json()
  const saved = await savePlatformConnection({
    userId,
    platform: "instagram",
    accessToken: tokenData.access_token,
    scopes: "user_profile,user_media",
    platformUserId: String(tokenData.user_id || profile.id || ""),
    accountName: profile.username ? `@${profile.username}` : null,
    metadata: {},
  })
  if (!saved.ok) return NextResponse.redirect(connectRedirect(origin, "instagram", { error: saved.error }))
  return NextResponse.redirect(connectRedirect(origin, "instagram", { success: "1" }))
}
