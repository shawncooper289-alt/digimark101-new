/**
 * Mirror of lib/ava/speech.ts for the founder office bundle.
 * Ava is always the long A: Ay-vuh, IPA /ˈeɪvə/. Display text stays "Ava".
 */
const NAME = /\bAva\b/g

export function spokenText(text: string) {
  return text.replace(NAME, "Ay-vuh")
}
