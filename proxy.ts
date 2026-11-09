import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { supabasePublicConfig } from "@/lib/supabase/config"

function requestHost(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-host") || request.headers.get("host") || ""
  return forwarded.split(",")[0]?.trim().split(":")[0]?.toLowerCase() || ""
}

export async function proxy(request: NextRequest) {
  if (requestHost(request) === "digimark101.com") {
    const url = request.nextUrl.clone()
    url.protocol = "https:"
    url.host = "www.digimark101.com"
    return NextResponse.redirect(url, 308)
  }

  let response = NextResponse.next({ request })
  const config = supabasePublicConfig()
  if (!config) return response

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
