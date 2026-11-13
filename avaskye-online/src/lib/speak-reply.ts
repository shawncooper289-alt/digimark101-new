import { DEVICE_VOICE_NOTE, speakAva } from "@/lib/ava-speech"

/** Wait until Ava finishes this line. Label the device voice when that is all that played. */
export function speakReply(line: string, aloud: boolean, onDevice: (note: string) => void) {
  if (!aloud || !line.trim()) return Promise.resolve()
  return new Promise<void>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }
    void speakAva(line, finish).then((result) => {
      if (result.voice === "device") onDevice(DEVICE_VOICE_NOTE)
      if (result.status !== "played") finish()
    })
  })
}
