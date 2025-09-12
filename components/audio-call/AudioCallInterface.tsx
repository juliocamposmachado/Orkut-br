'use client'

import { useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Timer
} from 'lucide-react'
import { AudioCallState } from '@/hooks/useAudioCall'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface AudioCallInterfaceProps {
  callState: AudioCallState
  onEndCall: () => void
  onToggleMute: () => void
  remoteUserInfo?: {
    username: string
    display_name: string
    photo_url?: string
  }
}

export function AudioCallInterface({
  callState,
  onEndCall,
  onToggleMute,
  remoteUserInfo
}: AudioCallInterfaceProps) {
  const [callDuration, setCallDuration] = useState(0)
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'medium' | 'poor'>('good')
  const callStartTime = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Timer para duração da chamada
  useEffect(() => {
    if (callState.status === 'connected' && !callStartTime.current) {
      callStartTime.current = Date.now()
    }

    if (callState.status === 'connected') {
      const timer = setInterval(() => {
        if (callStartTime.current) {
          setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000))
        }
      }, 1000)

      return () => clearInterval(timer)
    } else if (callState.status === 'ended') {
      callStartTime.current = null
      setCallDuration(0)
    }
  }, [callState.status])

  // Configurar áudio remoto
  useEffect(() => {
    if (callState.remoteStream && audioRef.current) {
      console.log('🔊 Configurando áudio remoto')
      audioRef.current.srcObject = callState.remoteStream
      audioRef.current.play().catch(console.error)
    }
  }, [callState.remoteStream])

  // Simular qualidade de conexão baseada no estado WebRTC
  useEffect(() => {
    const state = callState.connectionState
    if (state === 'connected') {
      setConnectionQuality('good')
    } else if (state === 'connecting') {
      setConnectionQuality('medium')
    } else if (state === 'disconnected' || state === 'failed') {
      setConnectionQuality('poor')
    }
  }, [callState.connectionState])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusMessage = () => {
    switch (callState.status) {
      case 'calling':
        return 'Chamando...'
      case 'ringing':
        return 'Tocando...'
      case 'connected':
        return `Conectado • ${formatDuration(callDuration)}`
      case 'ended':
        return callState.error || 'Chamada encerrada'
      default:
        return 'Aguardando...'
    }
  }

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'good':
        return <SignalHigh className="w-4 h-4 text-green-500" />
      case 'medium':
        return <SignalMedium className="w-4 h-4 text-yellow-500" />
      case 'poor':
        return <SignalLow className="w-4 h-4 text-red-500" />
    }
  }

  if (callState.status === 'idle') {
    return null
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-0">
      <CardContent className="p-6 text-center space-y-6">
        {/* Avatar do usuário */}
        <div className="flex flex-col items-center space-y-3">
          <Avatar className="w-24 h-24 ring-4 ring-blue-100">
            <AvatarImage 
              src={remoteUserInfo?.photo_url} 
              alt={remoteUserInfo?.display_name || 'Usuário'} 
            />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {remoteUserInfo?.display_name?.[0] || '?'}
            </AvatarFallback>
          </Avatar>

          {/* Nome e status */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-gray-900">
              {remoteUserInfo?.display_name || 'Usuário'}
            </h3>
            <p className="text-sm text-gray-500">
              @{remoteUserInfo?.username || 'username'}
            </p>
          </div>
        </div>

        {/* Status da chamada */}
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            {callState.status === 'connected' && <Timer className="w-4 h-4 text-gray-500" />}
            <Badge 
              variant={
                callState.status === 'connected' ? 'default' :
                callState.status === 'calling' || callState.status === 'ringing' ? 'secondary' :
                'destructive'
              }
              className="px-3 py-1"
            >
              {getStatusMessage()}
            </Badge>
            {callState.status === 'connected' && getConnectionIcon()}
          </div>

          {/* Indicador de conexão para chamadas em progresso */}
          {(callState.status === 'calling' || callState.status === 'ringing') && (
            <div className="space-y-2">
              <Progress value={undefined} className="w-full h-1" />
              <p className="text-xs text-gray-400">Estabelecendo conexão...</p>
            </div>
          )}
        </div>

        {/* Controles de chamada */}
        <div className="flex items-center justify-center space-x-4">
          {/* Botão Mute */}
          {callState.status === 'connected' && (
            <Button
              variant={callState.isMuted ? "destructive" : "outline"}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={onToggleMute}
            >
              {callState.isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
          )}

          {/* Botão Encerrar */}
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600"
            onClick={onEndCall}
          >
            <PhoneOff className="w-7 h-7" />
          </Button>

          {/* Indicador de volume (placeholder) */}
          {callState.status === 'connected' && (
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <Volume2 className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Informações técnicas (debug) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 space-y-1 border-t pt-3">
            <div>Status: {callState.status}</div>
            <div>Connection: {callState.connectionState || 'N/A'}</div>
            <div>Call ID: {callState.callId?.slice(-8) || 'N/A'}</div>
            {callState.error && (
              <div className="text-red-400">Error: {callState.error}</div>
            )}
          </div>
        )}

        {/* Elemento de áudio para reproduzir stream remoto */}
        <audio 
          ref={audioRef}
          autoPlay
          playsInline
          style={{ display: 'none' }}
        />
      </CardContent>
    </Card>
  )
}
