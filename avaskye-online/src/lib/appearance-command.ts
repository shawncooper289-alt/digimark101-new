/** Keep in sync with lib/office/intent.ts in the DigiMark101 app. */
export function visitorModeIntent(text: string): boolean | null {
  const q = text.toLowerCase()
  const rules: { mode: boolean; pattern: RegExp }[] = [
    { mode: true, pattern: /guests are coming|guests are here|switch to professional|professional outfit|visitor mode on|turn on visitor mode|enable visitor mode/ },
    { mode: false, pattern: /back to casual|switch to casual|casual outfit|visitor mode off|turn off visitor mode|leave visitor mode|guests (?:have|are) (?:gone|left)|guests left/ },
  ]
  let found: { mode: boolean; index: number } | null = null
  for (const rule of rules) {
    const match = rule.pattern.exec(q)
    if (!match) continue
    if (!found || match.index >= found.index) found = { mode: rule.mode, index: match.index }
  }
  return found ? found.mode : null
}

export function visitorModeReply(visitorMode: boolean) {
  return visitorMode
    ? "Visitor mode is on. The founder office shows the professional outfit until you say back to casual."
    : "Visitor mode is off. The founder office is back to today’s casual look."
}
