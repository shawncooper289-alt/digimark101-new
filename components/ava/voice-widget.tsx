'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Phone, PhoneOff, X, Minimize2, Maximize2, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useVoiceChat } from '@/hooks/use-voice-chat'
import { AvaAvatar } from '@/components/branding/ava-avatar'
import { DigiMarkLogo } from '@/components/branding/digimark-logo'
import { DIGIMARK_BRANDING } from '@/lib/constants/branding'

interface AvaVoiceWidgetProps {
  userId: string
  position?: 'bottom-right' | 'bottom-left'
  backendReady?: boolean
}

export function AvaVoiceWidget({ 
  userId, 
  position = 'bottom-right',
  backendReady = false
}: AvaVoiceWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  const {
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
  } = useVoiceChat({ userId })

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-6 right-6' 
    : 'bottom-6 left-6'

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`fixed ${positionClasses} z-[9999]`}
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                aria-label="Open Ava preview"
                onClick={() => setIsExpanded(true)}
                className="w-20 h-20 rounded-full shadow-2xl relative overflow-hidden border-4 border-white p-0"
                style={{ background: DIGIMARK_BRANDING.colors.gradient }}
              >
                {(isListening || isSpeaking) && (
                  <>
                    <motion.div
                      className="absolute inset-0 bg-white rounded-full"
                      animate={{ 
                        scale: [1, 1.4, 1],
                        opacity: [0.5, 0, 0.5]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-white rounded-full"
                      animate={{ 
                        scale: [1, 1.6, 1],
                        opacity: [0.3, 0, 0.3]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                  </>
                )}
                
                <AvaAvatar 
                  size="lg" 
                  className="relative z-10"
                  showOnlineIndicator={backendReady}
                  isAnimated={isSpeaking}
                />

                {isListening && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Mic className="w-4 h-4 text-white" />
                  </motion.div>
                )}

                {isCallActive && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Phone className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-12 right-0 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg"
            >
              Open Ava preview
              <div className="absolute bottom-0 right-6 w-3 h-3 bg-gray-900 transform rotate-45 translate-y-1/2" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Widget */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: 0,
              width: isMinimized ? '100px' : 'min(440px, calc(100vw - 48px))',
              height: isMinimized ? '100px' : 'min(680px, calc(100dvh - 48px))',
            }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className={`fixed ${positionClasses} z-[9999] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border-4 border-purple-200`}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div 
              className="p-5 flex items-center justify-between text-white relative overflow-hidden"
              style={{ background: DIGIMARK_BRANDING.colors.gradient }}
            >
              <motion.div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
                animate={{ backgroundPosition: ['0px 0px', '20px 20px'] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />

              <div className="absolute top-3 right-3 opacity-20">
                <DigiMarkLogo width={100} height={30} variant="white" />
              </div>

              {!isMinimized ? (
                <>
                  <div className="flex items-center gap-4 z-10">
                    <AvaAvatar 
                      size="lg" 
                      showOnlineIndicator={backendReady}
                      isAnimated={isSpeaking}
                    />
                    <div>
                      <h3 className="font-bold text-xl">Ava Skye</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {isCallActive ? (
                          <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                            On Call • {formatCallDuration(callDuration)}
                          </Badge>
                        ) : isListening ? (
                          <Badge variant="secondary" className="bg-red-500 text-white text-xs animate-pulse">
                            <Mic className="w-3 h-3 mr-1" />
                            Listening...
                          </Badge>
                        ) : isSpeaking ? (
                          <Badge variant="secondary" className="bg-blue-500 text-white text-xs animate-pulse">
                            <Volume2 className="w-3 h-3 mr-1" />
                            Speaking...
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                            <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                            {backendReady ? 'Ready' : 'Setup pending'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Minimize Ava preview"
                      onClick={() => setIsMinimized(true)}
                      className="text-white hover:bg-white/20 rounded-full"
                    >
                      <Minimize2 className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Close Ava preview"
                      onClick={() => setIsExpanded(false)}
                      className="text-white hover:bg-white/20 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Expand Ava preview"
                  onClick={() => setIsMinimized(false)}
                  className="text-white hover:bg-white/20 mx-auto rounded-full"
                >
                  <Maximize2 className="w-5 h-5" />
                </Button>
              )}
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-gray-50 to-white">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="mb-6"
                      >
                        <AvaAvatar size="xl" isAnimated={false} />
                      </motion.div>
                      
                      <h4 className="text-2xl font-bold text-gray-800 mb-2">
                        Hi! I&apos;m Ava Skye 👋
                      </h4>
                      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                        Your personal AI assistant for DigiMark101. 
                        Voice and calls are not connected in this preview.
                      </p>
                      
                      <div className="space-y-3 max-w-xs mx-auto">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start gap-3 h-auto py-3"
                            disabled={!backendReady}
                            onClick={startListening}
                          >
                            <span className="text-2xl">🎥</span>
                            <span className="text-left">
                              <div className="font-semibold">Create a Video</div>
                              <div className="text-xs text-gray-500">AI-powered video creation</div>
                            </span>
                          </Button>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start gap-3 h-auto py-3"
                            disabled={!backendReady}
                            onClick={startListening}
                          >
                            <span className="text-2xl">🌐</span>
                            <span className="text-left">
                              <div className="font-semibold">Build a Website</div>
                              <div className="text-xs text-gray-500">Launch your site today</div>
                            </span>
                          </Button>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start gap-3 h-auto py-3"
                            disabled={!backendReady}
                            onClick={startListening}
                          >
                            <span className="text-2xl">📧</span>
                            <span className="text-left">
                              <div className="font-semibold">Email Campaign</div>
                              <div className="text-xs text-gray-500">Reach your audience</div>
                            </span>
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.role === 'assistant' && (
                            <AvaAvatar size="sm" className="mr-2 mt-1" showOnlineIndicator={false} />
                          )}
                          
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {new Date(message.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>

                          {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-300 ml-2 mt-1 flex items-center justify-center text-sm font-bold">
                              U
                            </div>
                          )}
                        </motion.div>
                      ))}

                      {isSpeaking && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-start"
                        >
                          <AvaAvatar size="sm" className="mr-2" showOnlineIndicator={false} />
                          <div className="bg-gray-100 rounded-2xl px-4 py-3">
                            <div className="flex gap-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-2 h-2 bg-gray-400 rounded-full"
                                  animate={{ y: [0, -8, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Controls */}
                <div className="p-5 bg-white border-t-2 border-purple-100">
                  {transcript && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-4 p-3 bg-purple-50 rounded-xl"
                    >
                      <p className="text-sm text-purple-900 font-medium mb-1">You said:</p>
                      <p className="text-sm text-purple-700 italic">&quot;{transcript}&quot;</p>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      disabled={!backendReady}
                      onClick={isListening ? stopListening : startListening}
                      className={`h-16 rounded-2xl font-semibold transition-all ${
                        isListening
                          ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        <span className="text-xs">{isListening ? 'Stop' : 'Talk'}</span>
                      </div>
                    </Button>

                    <Button
                      disabled={!backendReady}
                      onClick={isCallActive ? endCall : initiateCall}
                      className={`h-16 rounded-2xl font-semibold ${
                        isCallActive
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {isCallActive ? <PhoneOff className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
                        <span className="text-xs">{isCallActive ? 'End' : 'Call'}</span>
                      </div>
                    </Button>
                  </div>

                  <p className="text-center text-xs text-gray-500 mt-4">
                    {isListening 
                      ? '🎤 Listening... Speak naturally' 
                      : isCallActive
                      ? '📞 Call in progress'
                      : backendReady ? 'Click microphone or call button to start' : 'Voice and calls pending backend setup'}
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
