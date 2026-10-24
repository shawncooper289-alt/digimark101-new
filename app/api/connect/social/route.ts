import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { currentUser } from "@/lib/supabase/server"
import { missingSocialEnv, signOAuthState, siteOrigin, SOCIAL_PROVIDERS, type SocialProviderId } from "@/lib/social/tokens"

const FIELD: Record<string, string> = {
  facebook: "facebook_url",
  instagram: "instagram_url",
  google: "google_business_url",
  website: "business_website",
  linkedin: "linkedin_url",
  tiktok: "tiktok_url",
  youtube: "youtube_url",
  x: "x_url",
}

function providerId(value: unknown): SocialProviderId | "website" | null {
  if (value === "website") return "website"
  return SOCIAL_PROVIDERS.some((item) => item.id === value) ? value as SocialProviderId : null
}

export async function GET() {
  const providers = [
    ...SOCIAL_PROVIDERS.map((provider) => {
      const missing = missingSocialEnv(provider.id)
      return { id: provider.id, label: provider.label, missing, ready: missing.length === 0 }
    }),
  ]
  return NextResponse.json({ providers })
}

export async function POST(request: Request) {
  const { user } = await currentUser()
  if (!user) return NextResponse.json({ error: "Sign in before connecting a social account." }, { status: 401 })
  const body = (await request.json().catch(() => null)) as { platform?: string; url?: string } | null
  const platform = providerId(body?.platform)
  if (!platform) return NextResponse.json({ error: "Unsupported platform" }, { status: 400 })

  const profileUrl = typeof body?.url === "string" ? body.url.trim().slice(0, 300) : ""
  const column = FIELD[platform]
  if (profileUrl && column) {
    const admin = createSupabaseAdmin()
    if (admin) {
      await admin.from("client_onboarding").update({ [column]: profileUrl }).eq("user_id", user.id)
    }
  }

  if (platform === "website") {
    return NextResponse.json({ success: true, message: "Website URL recorded. Verification stays manual until DNS or a meta tag is confirmed." })
  }

  const missing = missingSocialEnv(platform)
  if (missing.length) {
    return NextResponse.json({
      needsCredentials: true,
      missing,
      message: `Needs app credentials: ${missing.join(", ")}`,
    })
  }

  const origin = siteOrigin(request)
  const state = signOAuthState(user.id)
  const redirect = `${origin}/api/connect/callback/${platform}`
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
      const verifier = randomVerifier()
      const challenge = await pkceChallenge(verifier)
      authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.X_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect)}&scope=${encodeURIComponent("tweet.read tweet.write users.read offline.access")}&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`
      const response = NextResponse.json({ success: true, authUrl })
      response.cookies.set("social_x_verifier", verifier, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 })
      return response
    }
    default:
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 })
  }
  return NextResponse.json({ success: true, authUrl })
}

function randomVerifier() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes).toString("base64url")
}

async function pkceChallenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
  return Buffer.from(digest).toString("base64url")
}
