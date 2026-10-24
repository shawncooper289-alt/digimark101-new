import { NextRequest, NextResponse } from "next/server"
import { connectRedirect, savePlatformConnection, siteOrigin, verifyOAuthState } from "@/lib/social/tokens"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const origin = siteOrigin(req)
  if (error) return NextResponse.redirect(connectRedirect(origin, "google", { error }))
  const userId = verifyOAuthState(searchParams.get("state"))
  if (!code || !userId) return NextResponse.redirect(connectRedirect(origin, "google", { error: "missing_code" }))

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: `${origin}/api/connect/callback/google`,
      grant_type: "authorization_code",
    }),
  })
  const tokenData = await tokenRes.json()
  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(connectRedirect(origin, "google", { error: tokenData.error_description || tokenData.error || "token" }))
  }
  const infoRes = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${encodeURIComponent(tokenData.access_token)}`)
  const info = await infoRes.json()
  const accountsRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const accounts = await accountsRes.json()
  const account = accounts.accounts?.[0]
  const saved = await savePlatformConnection({
    userId,
    platform: "google",
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
    scopes: "https://www.googleapis.com/auth/business.manage",
    platformUserId: info.id || null,
    accountName: account?.accountName || info.name || null,
    metadata: { account_resource: typeof account?.name === "string" ? account.name : null },
  })
  if (!saved.ok) return NextResponse.redirect(connectRedirect(origin, "google", { error: saved.error }))
  return NextResponse.redirect(connectRedirect(origin, "google", { success: "1" }))
}
