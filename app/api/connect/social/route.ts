// app/api/connect/social/route.ts
// OAuth initiation for all supported platforms

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { user_id, platform, url } = await req.json();

  if (!user_id || !platform) {
    return NextResponse.json({ error: "user_id and platform required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const fieldMap: Record<string, string> = {
    facebook: "facebook_url",
    instagram: "instagram_url",
    google: "google_business_url",
    website: "business_website",
    linkedin: "linkedin_url",
    tiktok: "tiktok_url",
  };

  if (url && fieldMap[platform]) {
    await supabase
      .from("client_onboarding")
      .update({ [fieldMap[platform]]: url })
      .eq("user_id", user_id);
  }

  const state = Buffer.from(user_id).toString("base64url");
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  let authUrl = "";

  switch (platform) {
    case "facebook":
      authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${site}/api/connect/callback/facebook&scope=pages_show_list,pages_read_engagement,pages_manage_posts&state=${state}`;
      break;
    case "instagram":
      authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${site}/api/connect/callback/instagram&scope=user_profile,user_media&response_type=code&state=${state}`;
      break;
    case "google":
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${site}/api/connect/callback/google&scope=https://www.googleapis.com/auth/business.manage&response_type=code&access_type=offline&prompt=consent&state=${state}`;
      break;
    case "linkedin":
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${site}/api/connect/callback/linkedin&scope=openid%20profile%20email%20w_member_social&state=${state}`;
      break;
    case "tiktok":
      authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list,video.upload&response_type=code&redirect_uri=${site}/api/connect/callback/tiktok&state=${state}`;
      break;
    case "website":
      return NextResponse.json({
        success: true,
        message: "Website URL recorded. Verification agent can be activated after DNS or meta confirmation.",
      });
    default:
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }

  return NextResponse.json({ success: true, authUrl });
}