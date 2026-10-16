import { handleAvaPost } from "@/lib/ava/handle"

export const runtime = "nodejs"

export async function POST(request: Request) {
  return handleAvaPost(request)
}
