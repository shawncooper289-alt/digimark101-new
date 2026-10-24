// app/api/connect/callback/linkedin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=linkedin&error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=linkedin&error=missing_code`
    );
  }

  let userId: string;
  try {
    userId = Buffer.from(state, "base64url").toString("utf8");
  } catch {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=linkedin&error=invalid_state`
    );
  }

  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/connect/callback/linkedin`,
    }),
  });
  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=linkedin&error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`
    );
  }

  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json();

  const orgRes = await fetch(
    "https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget))",
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );
  const orgs = await orgRes.json();
  const org = orgs.elements?.[0]?.organizationalTarget;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("platform_tokens").upsert(
    {
      user_id: userId,
      platform: "linkedin",
      access_token: tokenData.access_token,
      token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      scopes: "openid profile email w_member_social",
      platform_user_id: profile.sub,
      platform_account_name: profile.name,
      metadata: { email: profile.email, org_urn: org },
    },
    { onConflict: "user_id,platform" }
  );

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/start/brief?connect=linkedin&success=1`
  );
}