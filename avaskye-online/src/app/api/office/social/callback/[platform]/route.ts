import { NextResponse } from "next/server"
import { officeOrigin, saveOfficeConnection, verifyOfficeState, type OfficeSocialId } from "@/lib/social-office"

function back(origin: string, platform: string, params: Record<string, string>) {
  const url = new URL("/social", origin)
  url.searchParams.set("connect", platform)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value.slice(0, 180))
  return NextResponse.redirect(url)
}

async function formToken(url: string, body: Record<string, string>, headers: Record<string, string> = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(body),
  })
  return response.json() as Promise<Record<string, unknown>>
}

export async function GET(request: Request, context: { params: Promise<{ platform: string }> }) {
  const { platform } = await context.params
  const origin = officeOrigin(request)
  const query = new URL(request.url).searchParams
  const error = query.get("error")
  if (error) return back(origin, platform, { error })
  const userId = verifyOfficeState(query.get("state"))
  const code = query.get("code") || ""
  if (!userId || !code) return back(origin, platform, { error: "missing_code" })
  const redirect = `${origin}/api/office/social/callback/${platform}`
  let access = ""
  let refresh = ""
  let expires: string | null = null
  let accountName: string | null = null
  let platformUserId: string | null = null
  let scopes = ""

  if (platform === "facebook") {
    const direct = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&redirect_uri=${encodeURIComponent(redirect)}&code=${encodeURIComponent(code)}`)
    const tokenBody = (await direct.json()) as { access_token?: string; error?: { message?: string } }
    if (!tokenBody.access_token) return back(origin, platform, { error: tokenBody.error?.message || "token" })
    access = tokenBody.access_token
    const me = (await (await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${encodeURIComponent(access)}`)).json()) as { id?: string; name?: string }
    platformUserId = me.id || null
    accountName = me.name || null
    scopes = "pages_show_list,pages_read_engagement,pages_manage_posts"
  } else if (platform === "instagram") {
    const tokenBody = await formToken("https://api.instagram.com/oauth/access_token", {
      client_id: process.env.INSTAGRAM_APP_ID || "",
      client_secret: process.env.INSTAGRAM_APP_SECRET || "",
      grant_type: "authorization_code",
      redirect_uri: redirect,
      code,
    })
    if (typeof tokenBody.access_token !== "string") return back(origin, platform, { error: "token" })
    access = tokenBody.access_token
    platformUserId = tokenBody.user_id ? String(tokenBody.user_id) : null
    scopes = "user_profile,user_media"
  } else if (platform === "google" || platform === "youtube") {
    const tokenBody = await formToken("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirect,
      grant_type: "authorization_code",
    })
    if (typeof tokenBody.access_token !== "string") return back(origin, platform, { error: "token" })
    access = tokenBody.access_token
    refresh = typeof tokenBody.refresh_token === "string" ? tokenBody.refresh_token : ""
    expires = typeof tokenBody.expires_in === "number" ? new Date(Date.now() + tokenBody.expires_in * 1000).toISOString() : null
    scopes = platform === "youtube" ? "youtube" : "business.manage"
  } else if (platform === "linkedin") {
    const tokenBody = await formToken("https://www.linkedin.com/oauth/v2/accessToken", {
      grant_type: "authorization_code",
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID || "",
      client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
      redirect_uri: redirect,
    })
    if (typeof tokenBody.access_token !== "string") return back(origin, platform, { error: "token" })
    access = tokenBody.access_token
    const profile = (await (await fetch("https://api.linkedin.com/v2/userinfo", { headers: { Authorization: `Bearer ${access}` } })).json()) as { sub?: string; name?: string }
    platformUserId = profile.sub || null
    accountName = profile.name || null
    scopes = "openid profile w_member_social"
  } else if (platform === "tiktok") {
    const tokenBody = await formToken("https://open.tiktokapis.com/v2/oauth/token/", {
      client_key: process.env.TIKTOK_CLIENT_KEY || "",
      client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
      code,
      grant_type: "authorization_code",
      redirect_uri: redirect,
    })
    if (typeof tokenBody.access_token !== "string") return back(origin, platform, { error: "token" })
    access = tokenBody.access_token
    refresh = typeof tokenBody.refresh_token === "string" ? tokenBody.refresh_token : ""
    scopes = "user.info.basic,video.list,video.upload"
  } else if (platform === "x") {
    const verifier = request.headers.get("cookie")?.match(/(?:^|;\s*)office_x_verifier=([^;]+)/)?.[1] || ""
    if (!verifier) return back(origin, platform, { error: "missing_code" })
    const basic = Buffer.from(`${process.env.X_CLIENT_ID || ""}:${process.env.X_CLIENT_SECRET || ""}`).toString("base64")
    const tokenBody = await formToken("https://api.twitter.com/2/oauth2/token", {
      code,
      grant_type: "authorization_code",
      client_id: process.env.X_CLIENT_ID || "",
      redirect_uri: redirect,
      code_verifier: decodeURIComponent(verifier),
    }, { Authorization: `Basic ${basic}` })
    if (typeof tokenBody.access_token !== "string") return back(origin, platform, { error: "token" })
    access = tokenBody.access_token
    refresh = typeof tokenBody.refresh_token === "string" ? tokenBody.refresh_token : ""
    scopes = "tweet.read tweet.write users.read offline.access"
  } else {
    return back(origin, platform, { error: "unsupported" })
  }

  const saved = await saveOfficeConnection({
    userId,
    platform: platform as OfficeSocialId,
    accessToken: access,
    refreshToken: refresh,
    expiresAt: expires,
    scopes,
    platformUserId,
    accountName,
  })
  if (!saved) return back(origin, platform, { error: "store" })
  const response = back(origin, platform, { success: "1" })
  response.cookies.set("office_x_verifier", "", { httpOnly: true, path: "/", maxAge: 0 })
  return response
}
