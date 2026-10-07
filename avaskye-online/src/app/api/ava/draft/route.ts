import { NextResponse } from "next/server";
import { draftFor } from "@/lib/catalog";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const kind = String(body.kind || "post");
  const brief = String(body.brief || "");
  return NextResponse.json({
    draft: draftFor(kind, brief),
    note: kind === "automation"
      ? "Template draft, not an AI-generated response. Live workflow connectors are not configured. Nothing was posted."
      : "Template draft, not an AI-generated response. Nothing was posted.",
  });
}
