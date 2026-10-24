import { NextRequest, NextResponse } from "next/server"
import { connectRedirect, savePlatformConnection, siteOrigin, verifyOAuthState } from "@/lib/social/tokens"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const origin = siteOrigin(req)
  if (error) return NextResponse.redirect(connectRedirect(origin, "x", { error }))
  const userId = verifyOAuthState(searchParams.get("state"))
  const verifier = req.cookies.get("social_x_verifier")?.value || ""
  if (!code || !userId || !verifier) return NextResponse.redirect(connectRedirect(origin, "x", { error: "missing_code" }))

  const basic = Buffer.from(`${process.env.X_CLIENT_ID || ""}:${process.env.X_CLIENT_SECRET || ""}`).toString("base64")
  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basic}` },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: process.env.X_CLIENT_ID || "",
      redirect_uri: `${origin}/api/connect/callback/x`,
      code_verifier: verifier,
    }),
  })
  const tokenData = await tokenRes.json()
  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(connectRedirect(origin, "x", { error: tokenData.error_description || tokenData.error || "token" }))
  }
  const meRes = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const me = await meRes.json()
  const saved = await savePlatformConnection({
    userId,
    platform: "x",
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
    scopes: "tweet.read tweet.write users.read offline.access",
    platformUserId: me.data?.id || null,
    accountName: me.data?.username ? `@${me.data.username}` : null,
    metadata: {},
  })
  if (!saved.ok) return NextResponse.redirect(connectRedirect(origin, "x", { error: saved.error }))
  const response = NextResponse.redirect(connectRedirect(origin, "x", { success: "1" }))
  response.cookies.set("social_x_verifier", "", { httpOnly: true, path: "/", maxAge: 0 })
  return response
}
