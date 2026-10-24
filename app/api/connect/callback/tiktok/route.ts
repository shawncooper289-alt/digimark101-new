import { NextRequest, NextResponse } from "next/server"
import { connectRedirect, savePlatformConnection, siteOrigin, verifyOAuthState } from "@/lib/social/tokens"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const origin = siteOrigin(req)
  if (error) return NextResponse.redirect(connectRedirect(origin, "tiktok", { error }))
  const userId = verifyOAuthState(searchParams.get("state"))
  if (!code || !userId) return NextResponse.redirect(connectRedirect(origin, "tiktok", { error: "missing_code" }))

  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY || "",
      client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
      code,
      grant_type: "authorization_code",
      redirect_uri: `${origin}/api/connect/callback/tiktok`,
    }),
  })
  const tokenData = await tokenRes.json()
  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(connectRedirect(origin, "tiktok", { error: tokenData.error_description || tokenData.error || "token" }))
  }
  const profileRes = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,display_name", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const profileData = await profileRes.json()
  const profile = profileData.data?.user
  const saved = await savePlatformConnection({
    userId,
    platform: "tiktok",
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
    scopes: "user.info.basic,video.list,video.upload",
    platformUserId: profile?.open_id || null,
    accountName: profile?.display_name || null,
    metadata: {},
  })
  if (!saved.ok) return NextResponse.redirect(connectRedirect(origin, "tiktok", { error: saved.error }))
  return NextResponse.redirect(connectRedirect(origin, "tiktok", { success: "1" }))
}
