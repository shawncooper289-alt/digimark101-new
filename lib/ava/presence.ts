/**
 * Where the public Ava launcher is allowed to sit.
 * Studio is decided in the widget (`pathname.startsWith("/studio")`) so the
 * launcher test can see that check. Everywhere else she stays off the page.
 */
const HELPFUL = [
  /^\/pricing(?:\/|$)/,
  /^\/start(?:\/|$)/,
  /^\/contact(?:\/|$)/,
  /^\/beta(?:\/|$)/,
  /^\/ava(?:\/|$)/,
  /^\/signup(?:\/|$)/,
  /^\/help(?:\/|$)/,
  /^\/login(?:\/|$)/,
  /^\/forgot-password(?:\/|$)/,
]

export function helpfulAvaPath(pathname: string) {
  const path = (pathname || "/").split("?")[0] || "/"
  return HELPFUL.some((pattern) => pattern.test(path))
}

export const AVA_DISMISS_KEY = "digimark101.ava.dismissed"
