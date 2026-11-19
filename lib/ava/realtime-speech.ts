/**
 * OpenAI's file speech models (gpt-4o-mini-tts, tts-1) shut down on Jan 6, 2027.
 * The replacement, gpt-realtime-2.1-mini, speaks over a Realtime session and
 * returns 24 kHz PCM. This wraps that PCM as a wav the browser can play.
 */

export const REALTIME_SAMPLE_RATE = 24000

type SocketLike = {
  addEventListener(type: "open" | "message" | "error", listener: (event: { data?: unknown }) => void): void
  send(data: string): void
  close(): void
}

export function pcm16ToWav(pcm: Uint8Array, sampleRate = REALTIME_SAMPLE_RATE) {
  const header = new Uint8Array(44)
  const view = new DataView(header.buffer)
  const text = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) header[offset + index] = value.charCodeAt(index)
  }
  text(0, "RIFF")
  view.setUint32(4, 36 + pcm.length, true)
  text(8, "WAVE")
  text(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  text(36, "data")
  view.setUint32(40, pcm.length, true)
  const wav = new Uint8Array(44 + pcm.length)
  wav.set(header, 0)
  wav.set(pcm, 44)
  return wav
}

function bytesOf(data: unknown) {
  if (typeof data === "string") return data
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data)
  if (ArrayBuffer.isView(data)) return new TextDecoder().decode(data)
  return ""
}

export async function speakOverRealtime(input: {
  url: string
  apiKey: string
  voice: string
  text: string
  instructions: string
  socketImpl?: new (url: string, options?: { headers?: Record<string, string> }) => SocketLike
  timeoutMs?: number
}) {
  const Socket = input.socketImpl ?? (globalThis.WebSocket as unknown as new (url: string, options?: { headers?: Record<string, string> }) => SocketLike)
  if (!Socket || !input.apiKey || !input.text) return null
  const script = `Read the following script aloud, word for word, with no extra words before or after it:\n${input.text}`
  return await new Promise<ArrayBuffer | null>((resolve) => {
    let settled = false
    let socket: SocketLike | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    const chunks: Uint8Array[] = []
    const finish = (audio: ArrayBuffer | null) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      try {
        socket?.close()
      } catch {
        // The socket may already be closed.
      }
      resolve(audio)
    }
    try {
      socket = new Socket(input.url, { headers: { Authorization: `Bearer ${input.apiKey}` } })
    } catch {
      resolve(null)
      return
    }
    timer = setTimeout(() => finish(null), input.timeoutMs ?? 18000)
    socket.addEventListener("error", () => finish(null))
    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({
        type: "session.update",
        session: {
          type: "realtime",
          instructions: input.instructions,
          output_modalities: ["audio"],
          audio: { output: { format: { type: "audio/pcm", rate: REALTIME_SAMPLE_RATE }, voice: input.voice } },
        },
      }))
      socket.send(JSON.stringify({
        type: "conversation.item.create",
        item: { type: "message", role: "user", content: [{ type: "input_text", text: script }] },
      }))
      socket.send(JSON.stringify({
        type: "response.create",
        response: { output_modalities: ["audio"] },
      }))
    })
    socket.addEventListener("message", (event) => {
      let message: { type?: string; delta?: string }
      try {
        message = JSON.parse(bytesOf(event.data)) as { type?: string; delta?: string }
      } catch {
        return
      }
      if (message.type === "response.output_audio.delta" && message.delta) {
        chunks.push(Buffer.from(message.delta, "base64"))
        return
      }
      if (message.type === "error") {
        finish(null)
        return
      }
      if (message.type === "response.done" || message.type === "response.output_audio.done") {
        if (!chunks.length) {
          finish(null)
          return
        }
        const size = chunks.reduce((total, chunk) => total + chunk.length, 0)
        const pcm = new Uint8Array(size)
        let offset = 0
        for (const chunk of chunks) {
          pcm.set(chunk, offset)
          offset += chunk.length
        }
        const wav = pcm16ToWav(pcm)
        finish(wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength) as ArrayBuffer)
      }
    })
  })
}
