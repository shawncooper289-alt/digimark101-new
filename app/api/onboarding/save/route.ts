// app/api/onboarding/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.json();
  const { user_id, ...fields } = body;

  if (!user_id) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("client_onboarding")
    .upsert(
      {
        user_id,
        ...fields,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}