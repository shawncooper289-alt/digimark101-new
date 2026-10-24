import { NextRequest, NextResponse } from "next/server"
import { connectRedirect, savePlatformConnection, siteOrigin, verifyOAuthState } from "@/lib/social/tokens"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const origin = siteOrigin(req)
  if (error) return NextResponse.redirect(connectRedirect(origin, "linkedin", { error }))
  const userId = verifyOAuthState(searchParams.get("state"))
  if (!code || !userId) return NextResponse.redirect(connectRedirect(origin, "linkedin", { error: "missing_code" }))

  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID || "",
      client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
      redirect_uri: `${origin}/api/connect/callback/linkedin`,
    }),
  })
  const tokenData = await tokenRes.json()
  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(connectRedirect(origin, "linkedin", { error: tokenData.error_description || tokenData.error || "token" }))
  }
  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const profile = await profileRes.json()
  const orgRes = await fetch(
    "https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget))",
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
  )
  const orgs = await orgRes.json()
  const org = orgs.elements?.[0]?.organizationalTarget
  const saved = await savePlatformConnection({
    userId,
    platform: "linkedin",
    accessToken: tokenData.access_token,
    expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
    scopes: "openid profile email w_member_social",
    platformUserId: profile.sub || null,
    accountName: profile.name || null,
    extra: typeof profile.email === "string" ? { email: profile.email } : {},
    metadata: { org_urn: typeof org === "string" ? org : null },
  })
  if (!saved.ok) return NextResponse.redirect(connectRedirect(origin, "linkedin", { error: saved.error }))
  return NextResponse.redirect(connectRedirect(origin, "linkedin", { success: "1" }))
}
