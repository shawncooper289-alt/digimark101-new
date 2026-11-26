export function cronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  const header = request.headers.get("authorization")
  return Boolean(secret && header === `Bearer ${secret}`)
}
