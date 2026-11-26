import { registryToolDefs } from "@/lib/ava/tools/registry"

/** The model only sees the agent's allow-list, with each tool's real parameters. */
export function specialistToolDefs(allow: readonly string[]) {
  const names = new Set(allow)
  return registryToolDefs().filter((tool) => names.has(tool.function.name))
}
