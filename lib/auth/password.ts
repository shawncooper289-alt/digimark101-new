export const MIN_PASSWORD_LENGTH = 6
export const PASSWORD_RULE = "Use at least 6 characters."

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emailFieldError(value: string) {
  const email = value.trim()
  if (!email) return "Enter your email."
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address."
  return ""
}

export function signupPasswordError(value: string) {
  if (!value) return "Enter a password."
  if (value.length < MIN_PASSWORD_LENGTH) return PASSWORD_RULE
  return ""
}
