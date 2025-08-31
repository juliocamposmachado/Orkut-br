'use client'

import { useWebRTC } from '@/contexts/webrtc-context'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Phone, Video, PhoneOff, Mic, MicOff, VideoOff, Users, Signal, Wifi, WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface CallStatusProps {
  className?: string
}

export function CallStatusIndicator({ className }: CallStatusProps) {
  const { callState, onlineUsers, isMuted, isVideoEnabled } = useWebRTC()
  const [callDuration, setCallDuration] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected')

  // Timer para duração da chamada
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (callState.isInCall && callState.callAccepted) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else {
      setCallDuration(0)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [callState.isInCall, callState.callAccepted])

  // Status da conexão
  useEffect(() => {
    if (callState.isInCall) {
      if (callState.callAccepted) {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('connecting')
      }
    } else {
      setConnectionStatus('disconnected')
    }
  }, [callState])

  // Formatar duração da chamada
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Se não há chamada ativa e não há usuários online, não mostrar nada
  if (!callState.isInCall && onlineUsers.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed top-4 right-4 z-40 ${className || ''}`}
      >
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-2 border-purple-100">
          <CardContent className="p-3">
            <div className="space-y-2">
              {/* Status da Conexão */}
              <div className="flex items-center space-x-2">
                {connectionStatus === 'connected' ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : connectionStatus === 'connecting' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Signal className="w-4 h-4 text-yellow-500" />
                  </motion.div>
                ) : (
                  <WifiOff className="w-4 h-4 text-gray-400" />
                )}
                
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    connectionStatus === 'connected' ? 'bg-green-100 text-green-700' :
                    connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}
                >
                  {connectionStatus === 'connected' ? 'Conectado' :
                   connectionStatus === 'connecting' ? 'Conectando...' :
                   'Desconectado'}
                </Badge>
              </div>

              {/* Chamada Ativa */}
              {callState.isInCall && (
                <div className="space-y-2">
                  {/* Info da Chamada */}
                  <div className="flex items-center space-x-2">
                    {callState.callType === 'video' ? (
                      <Video className="w-4 h-4 text-pink-500" />
                    ) : (
                      <Phone className="w-4 h-4 text-purple-500" />
                    )}
                    <span className="text-sm font-medium">
                      {callState.callingUser?.display_name || 'Usuário Desconhecido'}
                    </span>
                  </div>

                  {/* Duração da Chamada */}
                  {callState.callAccepted && (
                    <div className="text-center">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                          {formatDuration(callDuration)}
                        </Badge>
                      </motion.div>
                    </div>
                  )}

                  {/* Status da Chamada */}
                  {!callState.callAccepted && (
                    <div className="text-center">
                      <motion.p
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-sm text-purple-600"
                      >
                        {callState.receivingCall ? 'Chamada recebida...' : 'Chamando...'}
                      </motion.p>
                    </div>
                  )}

                  {/* Controles de Mídia */}
                  <div className="flex items-center justify-center space-x-2">
                    <Badge 
                      variant={isMuted ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {isMuted ? (
                        <MicOff className="w-3 h-3 mr-1" />
                      ) : (
                        <Mic className="w-3 h-3 mr-1" />
                      )}
                      {isMuted ? 'Mudo' : 'Áudio'}
                    </Badge>

                    {callState.callType === 'video' && (
                      <Badge 
                        variant={!isVideoEnabled ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {!isVideoEnabled ? (
                          <VideoOff className="w-3 h-3 mr-1" />
                        ) : (
                          <Video className="w-3 h-3 mr-1" />
                        )}
                        {!isVideoEnabled ? 'Sem Vídeo' : 'Vídeo'}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Usuários Online (quando não há chamada ativa) */}
              {!callState.isInCall && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    {onlineUsers.length} online
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
