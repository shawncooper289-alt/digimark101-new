export type KpiRow = {
  source: string
  metric: string
  value: number
  periodStart: string
  periodEnd: string
}

export function trafficDigest(input: { kpis: KpiRow[]; missing: string[] }) {
  const lines = ["Weekly traffic digest."]
  if (input.missing.length) {
    lines.push(`Not connected, so no numbers are filled in for: ${input.missing.join(", ")}.`)
  }
  if (!input.kpis.length) {
    lines.push("No measurement rows are stored.")
  } else {
    for (const row of input.kpis) {
      lines.push(`${row.source} ${row.metric} ${row.value} for ${row.periodStart} to ${row.periodEnd}.`)
    }
  }
  lines.push("These figures are copied from stored measurements. Nothing was estimated.")
  return lines.join("\n")
}

export function digestSources(kpis: KpiRow[]) {
  return kpis.map((row) => `${row.value} ${row.metric}`)
}
