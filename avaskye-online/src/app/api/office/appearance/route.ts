import { NextResponse } from "next/server"
import { visitorModeIntent, visitorModeReply } from "@/lib/appearance-command"
import { readGuidedMode, readOfficeOwner, readVisitorMode, saveGuidedMode, saveVisitorMode } from "@/lib/office-store"

export async function GET() {
  const [appearance, owner] = await Promise.all([readVisitorMode(), readOfficeOwner()])
  const guided = owner ? await readGuidedMode(owner.id) : { guidedMode: null, stored: false }
  return NextResponse.json({
    visitorMode: appearance.visitorMode,
    configured: appearance.configured,
    isOwner: Boolean(owner),
    guidedMode: owner ? guided.guidedMode : null,
    guidedStored: owner ? guided.stored : false,
  })
}

export async function POST(request: Request) {
  const owner = await readOfficeOwner()
  if (!owner) return NextResponse.json({ error: "Visitor mode is an owner office control." }, { status: 403 })
  const body = (await request.json().catch(() => null)) as { visitorMode?: boolean; command?: string; guidedMode?: boolean } | null
  if (typeof body?.guidedMode === "boolean") {
    const saved = await saveGuidedMode(owner.id, body.guidedMode)
    if (!saved) {
      return NextResponse.json({
        guidedMode: body.guidedMode,
        stored: false,
        reply: "Guided mode is saved in this browser. The office database has not stored it yet.",
      })
    }
    return NextResponse.json({
      guidedMode: body.guidedMode,
      stored: true,
      reply: body.guidedMode ? "Guided mode is on." : "Guided mode is off.",
    })
  }
  let next: boolean | null = null
  if (typeof body?.visitorMode === "boolean") next = body.visitorMode
  else if (typeof body?.command === "string") next = visitorModeIntent(body.command)
  if (next === null) {
    return NextResponse.json(
      { error: "Say guests are coming, switch to professional, or back to casual." },
      { status: 400 },
    )
  }
  const saved = await saveVisitorMode(owner.id, next)
  if (!saved) return NextResponse.json({ error: "The founder office could not save visitor mode." }, { status: 503 })
  return NextResponse.json({ visitorMode: next, reply: visitorModeReply(next) })
}
