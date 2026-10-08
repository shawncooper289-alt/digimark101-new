'use client'

import { useState, useEffect, useRef, useCallback, useEffectEvent } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface Recognition {
 continuous: boolean; interimResults: boolean; lang: string
 onresult: ((event: {resultIndex: number; results: {isFinal: boolean; [index: number]: {transcript: string}}[]}) => void) | null
 onerror: ((event: {error: string}) => void) | null
 onend: (() => void) | null
 start(): void; stop(): void
}
interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  audioUrl?: string
}

interface UseVoiceChatProps {
  userId: string
}

export function useVoiceChat({ userId }: UseVoiceChatProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  const recognitionRef = useRef<Recognition | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const callIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  const handleUserSpeech = async (text: string) => {
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setTranscript('')

    try {
      const response = await fetch('/api/ava/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: text,
          useVoice: true,
        }),
      })

      if (!response.ok) throw new Error('Ava service unavailable')
      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.text,
        timestamp: new Date(),
        audioUrl: data.audioUrl,
      }

      setMessages(prev => [...prev, assistantMessage])

      if (data.audioUrl) {
        await playAvaVoice(data.audioUrl)
      }
    } catch (error) {
      console.error('Error communicating with Ava:', error)
      toast({
        title: 'Connection Error',
        description: 'Could not reach Ava. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const playAvaVoice = async (audioUrl: string) => {
    setIsSpeaking(true)
    
    if (audioRef.current) {
      audioRef.current.pause()
    }

    audioRef.current = new Audio(audioUrl)
    audioRef.current.onended = () => {
      setIsSpeaking(false)
    }
    audioRef.current.onerror = () => {
      setIsSpeaking(false)
      toast({
        title: 'Audio Error',
        description: 'Could not play Ava\'s response.',
        variant: 'destructive',
      })
    }

    try {
      await audioRef.current.play()
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsSpeaking(false)
    }
  }

  const onSpeech = useEffectEvent((text: string) => { void handleUserSpeech(text) })
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as unknown as {webkitSpeechRecognition: new () => Recognition}).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex
        const transcriptText = event.results[current][0].transcript
        setTranscript(transcriptText)

        if (event.results[current].isFinal) {
          onSpeech(transcriptText)
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        toast({
          title: 'Voice Error',
          description: 'Could not capture your voice. Please try again.',
          variant: 'destructive',
        })
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    return () => {
      if (audioRef.current) audioRef.current.pause()
      if (callIntervalRef.current) clearInterval(callIntervalRef.current)
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [toast])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        toast({
          title: '🎤 Listening',
          description: 'Speak now...',
        })
      } catch (error) {
        console.error('Error starting recognition:', error)
      }
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

      if (!response.ok) throw new Error('Ava service unavailable')
      const data = await response.json()

      if (data.success) {
        setIsCallActive(true)
        setCallDuration(0)
        
        callIntervalRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1)
        }, 1000)

        toast({
          title: '📞 Call Connected',
          description: 'You are now connected with Ava',
        })
      }
    } catch (error) {
      console.error('Error initiating call:', error)
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

      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current)
      }

      setIsCallActive(false)
      setCallDuration(0)

      toast({
        title: 'Call Ended',
        description: `Call duration: ${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}`,
      })
    } catch (error) {
      console.error('Error ending call:', error)
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
