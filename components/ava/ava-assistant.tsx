'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

type SpeechRecognitionConstructor = new () => SpeechRecognition

type SpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionEvent = { results: { [index: number]: { [index: number]: { transcript: string } } } }
type SpeechRecognitionErrorEvent = { error: string }

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

const welcome: ChatMessage = {
  role: 'assistant',
  content: 'Hi, I’m Ava. I can help you shape a campaign, improve your content, or map your next growth move. What are you working on?',
}

export function AvaAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcome])
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const messagesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setVoiceEnabled(Boolean(window.speechSynthesis))
  }, [])

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isOpen])

  function speak(text: string) {
    if (!voiceEnabled) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    window.speechSynthesis.speak(utterance)
  }

  async function sendMessage(value = input) {
    const message = value.trim()
    if (!message || isLoading) return

    const nextMessages = [...messages, { role: 'user' as const, content: message }]
    setMessages(nextMessages)
    setInput('')
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ava/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: messages.slice(-12) }),
      })
      const data = (await response.json()) as { text?: string; error?: string }
      if (!response.ok || !data.text) throw new Error(data.error || 'Ava did not return a response.')

      setMessages((current) => [...current, { role: 'assistant', content: data.text! }])
      speak(data.text)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Ava is unavailable right now.')
    } finally {
      setIsLoading(false)
    }
  }

  function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      setError('Voice input is not supported in this browser. Type your message instead.')
      return
    }

    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      void sendMessage(transcript)
    }
    recognition.onerror = () => setError('I could not hear that. Check microphone permission and try again.')
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    setError('')
    setIsListening(true)
    recognition.start()
  }

  function toggleListening() {
    if (isListening) recognitionRef.current?.stop()
    else startListening()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage()
  }

  return (
    <aside className={`ava ${isOpen ? 'ava-open' : ''}`} aria-label="Ask Ava">
      {isOpen && <div className="ava-panel">
        <div className="ava-header"><div><span className="ava-status" /> Ava <small>AI marketing guide</small></div><button type="button" onClick={() => setIsOpen(false)} aria-label="Close Ava">×</button></div>
        <div className="ava-messages" ref={messagesRef} aria-live="polite">
          {messages.map((message, index) => <p className={`ava-message ${message.role}`} key={`${message.role}-${index}`}>{message.content}</p>)}
          {isLoading && <p className="ava-message assistant">Ava is thinking…</p>}
        </div>
        {error && <p className="ava-error" role="alert">{error}</p>}
        <form className="ava-compose" onSubmit={submit}>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Ava anything…" maxLength={2000} disabled={isLoading} aria-label="Message Ava" />
          <button className={isListening ? 'listening' : ''} type="button" onClick={toggleListening} aria-label={isListening ? 'Stop listening' : 'Speak to Ava'} disabled={isLoading}>{isListening ? '■' : '◉'}</button>
          <button type="submit" disabled={isLoading || !input.trim()}>Send</button>
        </form>
        <p className="ava-note">Voice input uses your browser. Ava’s replies can be spoken aloud when supported.</p>
      </div>}
      <button className="ava-launcher" type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen}><span>✦</span> Ask Ava</button>
    </aside>
  )
}
