'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  audioUrl?: string
}

interface UseVoiceChatProps {
  userId: string
}

type SpeechRecognitionAlternativeLike = { transcript: string }
type SpeechRecognitionResultLike = { 0: SpeechRecognitionAlternativeLike; isFinal: boolean }
type SpeechRecognitionEventLike = { resultIndex: number; results: SpeechRecognitionResultLike[] }
type SpeechRecognitionErrorEventLike = { error: string }

type RecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type BrowserWindow = Window & {
  webkitSpeechRecognition?: new () => RecognitionLike
}

export function useVoiceChat({ userId }: UseVoiceChatProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  const recognitionRef = useRef<RecognitionLike | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const callIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { toast } = useToast()

  const playAvaVoice = useCallback(
    async (audioUrl: string) => {
      setIsSpeaking(true)

      audioRef.current?.pause()
      audioRef.current = new Audio(audioUrl)

      audioRef.current.onended = () => setIsSpeaking(false)
      audioRef.current.onerror = () => {
        setIsSpeaking(false)
        toast({
          title: 'Audio Error',
          description: "Could not play Ava's response.",
          variant: 'destructive',
        })
      }

      try {
        await audioRef.current.play()
      } catch {
        setIsSpeaking(false)
      }
    },
    [toast]
  )

  const handleUserSpeech = useCallback(
    async (text: string) => {
      setMessages((prev) => [...prev, { role: 'user', content: text, timestamp: new Date() }])
      setTranscript('')

      try {
        const response = await fetch('/api/ava/voice-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, message: text, useVoice: true }),
        })

        const data = await response.json()

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.text, timestamp: new Date(), audioUrl: data.audioUrl || undefined },
        ])

        if (data.audioUrl) {
          await playAvaVoice(data.audioUrl)
        }
      } catch {
        toast({
          title: 'Connection Error',
          description: 'Could not reach Ava. Please try again.',
          variant: 'destructive',
        })
      }
    },
    [playAvaVoice, toast, userId]
  )

  useEffect(() => {
    const browserWindow = window as BrowserWindow

    if (browserWindow.webkitSpeechRecognition) {
      const SpeechRecognition = browserWindow.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex
        const transcriptText = event.results[current][0].transcript
        setTranscript(transcriptText)

        if (event.results[current].isFinal) {
          handleUserSpeech(transcriptText)
        }
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
        toast({
          title: 'Voice Error',
          description: 'Could not capture your voice. Please try again.',
          variant: 'destructive',
        })
      }

      recognitionRef.current.onend = () => setIsListening(false)
    }

    return () => {
      recognitionRef.current?.stop()
      if (callIntervalRef.current) clearInterval(callIntervalRef.current)
    }
  }, [handleUserSpeech, toast])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
      setIsListening(true)
      toast({ title: '🎤 Listening', description: 'Speak now...' })
    }
  }, [isListening, toast])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  const initiateCall = async () => {
    try {
      const response = await fetch('/api/ava/initiate-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (data.success) {
        setIsCallActive(true)
        setCallDuration(0)
        callIntervalRef.current = setInterval(() => setCallDuration((prev) => prev + 1), 1000)
        toast({ title: '📞 Call Connected', description: 'You are now connected with Ava' })
      }
    } catch {
      toast({
        title: 'Call Failed',
        description: 'Could not connect to Ava. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const endCall = async () => {
    try {
      await fetch('/api/ava/end-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (callIntervalRef.current) clearInterval(callIntervalRef.current)
      setIsCallActive(false)
      setCallDuration(0)

      toast({
        title: 'Call Ended',
        description: `Call duration: ${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}`,
      })
    } catch {
      // no-op
    }
  }

  return {
    isListening,
    isSpeaking,
    transcript,
    messages,
    startListening,
    stopListening,
    initiateCall,
    endCall,
    isCallActive,
    callDuration,
  }
}
