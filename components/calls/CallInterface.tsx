'use client'

import React, { useEffect, useState } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, PhoneCall } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CallState } from '@/hooks/useWebRTC'

interface CallInterfaceProps {
  callState: CallState
  localVideoRef: React.RefObject<HTMLVideoElement>
  remoteVideoRef: React.RefObject<HTMLVideoElement>
  onAccept: () => void
  onReject: () => void
  onEndCall: () => void
  onToggleMute: () => void
  onToggleVideo: () => void
  isMuted: boolean
  isVideoEnabled: boolean
  connectionState: RTCPeerConnectionState
  remoteUserInfo?: {
    name: string
    photo_url?: string
  }
}

export const CallInterface: React.FC<CallInterfaceProps> = ({
  callState,
  localVideoRef,
  remoteVideoRef,
  onAccept,
  onReject,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  isMuted,
  isVideoEnabled,
  connectionState,
  remoteUserInfo
}) => {
  const [callDuration, setCallDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)

  // Timer para duração da chamada
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (callState.isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else {
      setCallDuration(0)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [callState.isCallActive])

  // Auto-hide controls em chamadas de vídeo
  useEffect(() => {
    if (callState.callType === 'video' && callState.isCallActive) {
      const hideControls = () => {
        setShowControls(false)
      }

      const showControlsTemporary = () => {
        setShowControls(true)
        if (controlsTimeout) {
          clearTimeout(controlsTimeout)
        }
        setControlsTimeout(setTimeout(hideControls, 3000))
      }

      showControlsTemporary()

      return () => {
        if (controlsTimeout) {
          clearTimeout(controlsTimeout)
        }
      }
    }
  }, [callState.callType, callState.isCallActive, controlsTimeout])

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getCallStatusText = (): string => {
    if (callState.isIncomingCall) {
      return `Chamada ${callState.callType === 'video' ? 'de vídeo' : 'de áudio'} recebida`
    }
    if (callState.isOutgoingCall) {
      return 'Chamando...'
    }
    if (callState.isConnecting) {
      return 'Conectando...'
    }
    if (callState.isCallActive) {
      return formatDuration(callDuration)
    }
    return ''
  }

  const handleMouseMove = () => {
    if (callState.callType === 'video' && callState.isCallActive) {
      setShowControls(true)
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }
      setControlsTimeout(setTimeout(() => setShowControls(false), 3000))
    }
  }

  // Não renderizar se não há chamada ativa
  if (!callState.isIncomingCall && !callState.isOutgoingCall && !callState.isCallActive && !callState.isConnecting) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onMouseMove={handleMouseMove}
    >
      {/* Interface de chamada de vídeo */}
      {callState.callType === 'video' && (
        <>
          {/* Vídeo remoto (tela cheia) */}
          <div className="flex-1 relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Overlay quando não há stream remoto */}
            {(!callState.remoteStream || !callState.isCallActive) && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <Avatar className="w-32 h-32 mx-auto mb-4">
                    <AvatarImage src={remoteUserInfo?.photo_url} />
                    <AvatarFallback className="text-4xl">
                      {remoteUserInfo?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-semibold mb-2">
                    {remoteUserInfo?.name || 'Usuário'}
                  </h2>
                  <p className="text-gray-300">{getCallStatusText()}</p>
                </div>
              </div>
            )}
            
            {/* Vídeo local (picture-in-picture) */}
            {callState.localStream && (
              <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Interface de chamada de áudio */}
      {callState.callType === 'audio' && (
        <div className="flex-1 bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
          <div className="text-center text-white">
            <Avatar className="w-32 h-32 mx-auto mb-6">
              <AvatarImage src={remoteUserInfo?.photo_url} />
              <AvatarFallback className="text-4xl">
                {remoteUserInfo?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-3xl font-semibold mb-4">
              {remoteUserInfo?.name || 'Usuário'}
            </h2>
            <p className="text-xl text-gray-200 mb-2">{getCallStatusText()}</p>
            <p className="text-sm text-gray-300">
              Status: {connectionState === 'connected' ? 'Conectado' : 'Conectando...'}
            </p>
          </div>
        </div>
      )}

      {/* Controles da chamada */}
      <div className={`
        ${callState.callType === 'video' ? 'absolute bottom-0 left-0 right-0' : ''}
        ${callState.callType === 'video' && !showControls && callState.isCallActive ? 'opacity-0' : 'opacity-100'}
        transition-opacity duration-300
        bg-black bg-opacity-75 p-6
      `}>
        <div className="flex justify-center items-center space-x-6">
          
          {/* Chamada recebida - Botões de aceitar/rejeitar */}
          {callState.isIncomingCall && (
            <>
              <Button
                onClick={onReject}
                variant="destructive"
                size="lg"
                className="rounded-full w-16 h-16 p-0"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
              
              <Button
                onClick={onAccept}
                className="rounded-full w-16 h-16 p-0 bg-green-500 hover:bg-green-600"
              >
                <Phone className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Chamada ativa - Controles normais */}
          {(callState.isCallActive || callState.isOutgoingCall) && (
            <>
              {/* Mute/Unmute */}
              <Button
                onClick={onToggleMute}
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full w-14 h-14 p-0"
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              {/* Toggle Video (apenas em chamadas de vídeo) */}
              {callState.callType === 'video' && (
                <Button
                  onClick={onToggleVideo}
                  variant={!isVideoEnabled ? "destructive" : "secondary"}
                  size="lg"
                  className="rounded-full w-14 h-14 p-0"
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
              )}

              {/* Encerrar chamada */}
              <Button
                onClick={onEndCall}
                variant="destructive"
                size="lg"
                className="rounded-full w-16 h-16 p-0"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Chamada sendo conectada */}
          {callState.isConnecting && !callState.isIncomingCall && (
            <Button
              onClick={onEndCall}
              variant="destructive"
              size="lg"
              className="rounded-full w-16 h-16 p-0"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          )}
        </div>

        {/* Informações adicionais */}
        <div className="text-center mt-4 text-white">
          {callState.isCallActive && (
            <p className="text-sm opacity-75">
              Qualidade: {connectionState === 'connected' ? '✅ Excelente' : '⚠️ Conectando...'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
