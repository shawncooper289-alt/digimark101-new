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
}

export function AvaVoiceWidget({ userId, position = 'bottom-right' }: AvaVoiceWidgetProps) {
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

  const positionClasses = position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
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
                onClick={() => setIsExpanded(true)}
                className="w-20 h-20 rounded-full shadow-2xl relative overflow-hidden border-4 border-white p-0"
                style={{ background: DIGIMARK_BRANDING.colors.gradient }}
              >
                {(isListening || isSpeaking) && (
                  <>
                    <motion.div
                      className="absolute inset-0 bg-white rounded-full"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-white rounded-full"
                      animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                  </>
                )}

                <AvaAvatar size="lg" className="relative z-10" showOnlineIndicator isAnimated={isSpeaking} />

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
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              width: isMinimized ? '100px' : '440px',
              height: isMinimized ? '100px' : '680px',
            }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className={`fixed ${positionClasses} z-[9999] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border-4 border-purple-200`}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="p-5 flex items-center justify-between text-white relative overflow-hidden" style={{ background: DIGIMARK_BRANDING.colors.gradient }}>
              <div className="absolute top-3 right-3 opacity-20">
                <DigiMarkLogo width={100} height={30} variant="white" />
              </div>

              {!isMinimized ? (
                <>
                  <div className="flex items-center gap-4 z-10">
                    <AvaAvatar size="lg" showOnlineIndicator isAnimated={isSpeaking} />
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
                            Ready
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 z-10">
                    <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)} className="text-white hover:bg-white/20 rounded-full">
                      <Minimize2 className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)} className="text-white hover:bg-white/20 rounded-full">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="w-full flex items-center justify-between z-10">
                  <AvaAvatar size="md" showOnlineIndicator isAnimated={isSpeaking} />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setIsMinimized(false)} className="text-white hover:bg-white/20 rounded-full w-8 h-8">
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)} className="text-white hover:bg-white/20 rounded-full w-8 h-8">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-purple-50 to-pink-50">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-sm">👋 Hi! I&apos;m Ava. Start talking to me!</p>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] p-3 rounded-2xl ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                : 'bg-white border border-purple-200 text-gray-800 shadow-sm'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                    {transcript && (
                      <div className="text-center">
                        <Badge variant="outline" className="animate-pulse">
                          {transcript}
                        </Badge>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="p-4 bg-white border-t border-purple-100">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={isListening ? stopListening : startListening}
                      className={`h-12 rounded-xl ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-5 h-5 mr-2" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5 mr-2" />
                          Talk
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={isCallActive ? endCall : initiateCall}
                      className={`h-12 rounded-xl ${isCallActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                      {isCallActive ? (
                        <>
                          <PhoneOff className="w-5 h-5 mr-2" />
                          End Call
                        </>
                      ) : (
                        <>
                          <Phone className="w-5 h-5 mr-2" />
                          Call Ava
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
