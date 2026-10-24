// app/api/connect/social/route.ts
// Scaffold for OAuth initiation and token storage
// Full OAuth requires Meta App ID/Secret, Google Client ID/Secret, redirect URIs
// Tokens stored in a separate secure table (not shown here for brevity)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { user_id, platform, url } = await req.json();

  if (!user_id || !platform) {
    return NextResponse.json({ error: "user_id and platform required" }, { status: 400 });
  }

  // Explicit permission check (hard rule: no connects without yes)
  // In production, verify session and client confirmation

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Record the URL provided
  const fieldMap: Record<string, string> = {
    facebook: "facebook_url",
    instagram: "instagram_url",
    google: "google_business_url",
    website: "business_website",
  };

  if (url && fieldMap[platform]) {
    await supabase
      .from("client_onboarding")
      .update({ [fieldMap[platform]]: url })
      .eq("user_id", user_id);
  }

  // Launch OAuth (placeholder — replace with real flows)
  let authUrl = "";
  switch (platform) {
    case "facebook":
      authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${process.env.NEXT_PUBLIC_SITE_URL}/api/connect/callback/facebook&scope=pages_show_list,pages_read_engagement,pages_manage_posts`;
      break;
    case "instagram":
      authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${process.env.NEXT_PUBLIC_SITE_URL}/api/connect/callback/instagram&scope=user_profile,user_media&response_type=code`;
      break;
    case "google":
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_SITE_URL}/api/connect/callback/google&scope=https://www.googleapis.com/auth/business.manage&response_type=code&access_type=offline`;
      break;
    case "website":
      // Simple verification: crawl or ask for meta tag / file
      return NextResponse.json({
        success: true,
        message: "Website URL recorded. Verification agent can be activated after DNS or meta confirmation.",
      });
    default:
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    authUrl,
    message: `Redirect user to authorize ${platform}. Tokens will be stored securely on callback.`,
  });
}