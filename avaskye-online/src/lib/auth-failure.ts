/** Map Auth failures to actionable messages; never return raw provider responses or tokens. */
export function authFailure(status: number, code: unknown) {
  const known = typeof code === "string" ? code : ""
  if (status === 429 || known === "over_request_rate_limit") {
    return { status: 429, error: "Too many sign-in attempts. Wait a few minutes and try again." }
  }
  if (known === "email_not_confirmed") {
    return { status: 401, error: "Confirm your email first, or request a new login link." }
  }
  if (known === "invalid_credentials" || (status === 400 && !known)) {
    return { status: 401, error: "The email or password was not accepted. Use your DigiMark101 account password, or request a login link." }
  }
  if (status === 401 || status === 403 || known === "bad_jwt") {
    return { status: 503, error: "The office could not authenticate with the shared backend. Please contact the site administrator." }
  }
  return { status: 503, error: "The shared sign-in service is unavailable. Please try again shortly." }
}
