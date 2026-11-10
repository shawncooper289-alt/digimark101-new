/** Map Auth failures to actionable messages. Never return raw provider responses or tokens. */
export function authFailure(status: number, code: unknown, detail?: unknown) {
  const known = typeof code === "string" ? code : ""
  const text = typeof detail === "string" ? detail : ""
  if (isEmailRateLimit(status, known, text)) {
    return {
      status: 429,
      error: "Too many emails were sent. Wait a few minutes before requesting another login or reset link.",
    }
  }
  if (status === 429 || known === "over_request_rate_limit") {
    return { status: 429, error: "Too many sign-in attempts. Wait a few minutes and try again." }
  }
  if (known === "email_not_confirmed") {
    return { status: 401, error: "Confirm your email first, or request a new login link." }
  }
  if (known === "invalid_credentials" || (status === 400 && !known)) {
    return {
      status: 401,
      error: "The email or password was not accepted. Use your DigiMark101 account password, or request a login link.",
    }
  }
  if (status === 401 || status === 403 || known === "bad_jwt") {
    return { status: 503, error: "The office could not authenticate with the shared backend. Please contact the site administrator." }
  }
  return { status: 503, error: "The shared sign-in service is unavailable. Please try again shortly." }
}

export function isEmailRateLimit(status: number, code: string, detail: string) {
  return (
    code === "over_email_send_rate_limit" ||
    /email rate limit/i.test(code) ||
    /email rate limit/i.test(detail) ||
    (status === 429 && /email/i.test(detail))
  )
}

export async function readAuthError(response: Response) {
  const text = await response.text().catch(() => "")
  let code: unknown = ""
  let detail = text
  try {
    const body = JSON.parse(text) as Record<string, unknown>
    code = body.error_code || body.code || ""
    const message = body.msg || body.message || body.error_description || body.error
    if (typeof message === "string") detail = message
  } catch {
    detail = text
  }
  return authFailure(response.status, code, detail)
}
