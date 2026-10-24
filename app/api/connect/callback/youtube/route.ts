import { NextRequest, NextResponse } from "next/server"
import { connectRedirect, savePlatformConnection, siteOrigin, verifyOAuthState } from "@/lib/social/tokens"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const origin = siteOrigin(req)
  if (error) return NextResponse.redirect(connectRedirect(origin, "youtube", { error }))
  const userId = verifyOAuthState(searchParams.get("state"))
  if (!code || !userId) return NextResponse.redirect(connectRedirect(origin, "youtube", { error: "missing_code" }))

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: `${origin}/api/connect/callback/youtube`,
      grant_type: "authorization_code",
    }),
  })
  const tokenData = await tokenRes.json()
  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(connectRedirect(origin, "youtube", { error: tokenData.error_description || tokenData.error || "token" }))
  }
  const channelRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const channelBody = await channelRes.json()
  const channel = channelBody.items?.[0]
  const saved = await savePlatformConnection({
    userId,
    platform: "youtube",
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
    scopes: "youtube.readonly youtube.upload",
    platformUserId: channel?.id || null,
    accountName: channel?.snippet?.title || null,
    metadata: {},
  })
  if (!saved.ok) return NextResponse.redirect(connectRedirect(origin, "youtube", { error: saved.error }))
  return NextResponse.redirect(connectRedirect(origin, "youtube", { success: "1" }))
}
