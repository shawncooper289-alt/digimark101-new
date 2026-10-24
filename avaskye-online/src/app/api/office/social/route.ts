import { NextResponse } from "next/server"
import { readOfficeOwner } from "@/lib/office-store"
import { missingOfficeSocial, officeOrigin, OFFICE_SOCIAL, signOfficeState, type OfficeSocialId } from "@/lib/social-office"

function providerId(value: unknown): OfficeSocialId | null {
  return OFFICE_SOCIAL.some((item) => item.id === value) ? value as OfficeSocialId : null
}

export async function POST(request: Request) {
  const owner = await readOfficeOwner()
  if (!owner) return NextResponse.json({ error: "The owner office is closed." }, { status: 403 })
  const body = (await request.json().catch(() => null)) as { platform?: string } | null
  const platform = providerId(body?.platform)
  if (!platform) return NextResponse.json({ error: "Unsupported platform." }, { status: 400 })
  const missing = missingOfficeSocial(platform)
  if (missing.length) {
    return NextResponse.json({ needsCredentials: true, missing, message: `Needs app credentials: ${missing.join(", ")}` })
  }
  const origin = officeOrigin(request)
  const redirect = `${origin}/api/office/social/callback/${platform}`
  const state = signOfficeState(owner.id)
  let authUrl = ""
  switch (platform) {
    case "facebook":
      authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(redirect)}&scope=pages_show_list,pages_read_engagement,pages_manage_posts&state=${state}`
      break
    case "instagram":
      authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(redirect)}&scope=user_profile,user_media&response_type=code&state=${state}`
      break
    case "google":
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect)}&scope=${encodeURIComponent("https://www.googleapis.com/auth/business.manage")}&response_type=code&access_type=offline&prompt=consent&state=${state}`
      break
    case "youtube":
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect)}&scope=${encodeURIComponent("https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload")}&response_type=code&access_type=offline&prompt=consent&state=${state}`
      break
    case "linkedin":
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect)}&scope=${encodeURIComponent("openid profile email w_member_social")}&state=${state}`
      break
    case "tiktok":
      authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list,video.upload&response_type=code&redirect_uri=${encodeURIComponent(redirect)}&state=${state}`
      break
    case "x": {
      const verifier = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url")
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
      const challenge = Buffer.from(digest).toString("base64url")
      authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.X_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect)}&scope=${encodeURIComponent("tweet.read tweet.write users.read offline.access")}&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`
      const response = NextResponse.json({ authUrl })
      response.cookies.set("office_x_verifier", verifier, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 })
      return response
    }
    default:
      return NextResponse.json({ error: "Unsupported platform." }, { status: 400 })
  }
  return NextResponse.json({ authUrl })
}
