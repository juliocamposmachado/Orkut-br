'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  VolumeX,
  Volume2,
  Settings,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface CallModalProps {
  isOpen: boolean
  onClose: () => void
  callType: 'video' | 'audio'
  targetUser: {
    id: string
    name: string
    photo?: string
    username?: string
  }
}

type CallState = 'connecting' | 'ringing' | 'connected' | 'ended' | 'declined'

export function CallModal({ isOpen, onClose, callType, targetUser }: CallModalProps) {
  const { user, profile } = useAuth()
  const [callState, setCallState] = useState<CallState>('connecting')
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video')
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const callTimer = useRef<NodeJS.Timeout>()

  // Simulação de estados da chamada
  useEffect(() => {
    if (!isOpen) return

    // Simular processo de chamada
    const connectionFlow = async () => {
      // 1. Connecting (1 segundo)
      setCallState('connecting')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 2. Ringing (3-5 segundos aleatório)
      setCallState('ringing')
      const ringDuration = Math.random() * 2000 + 3000
      await new Promise(resolve => setTimeout(resolve, ringDuration))

      // 3. 80% chance de conectar, 20% de recusar
      if (Math.random() > 0.2) {
        setCallState('connected')
        startCallTimer()
        await initializeMedia()
      } else {
        setCallState('declined')
        setTimeout(() => {
          toast.error(`${targetUser.name} não atendeu a chamada`)
          onClose()
        }, 2000)
      }
    }

    connectionFlow()

    return () => {
      if (callTimer.current) {
        clearInterval(callTimer.current)
      }
    }
  }, [isOpen, targetUser.name, onClose])

  const startCallTimer = () => {
    callTimer.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
  }

  const initializeMedia = async () => {
    try {
      if (!localVideoRef.current) return

      const constraints = {
        video: callType === 'video',
        audio: true
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localVideoRef.current.srcObject = stream

      // Simular vídeo do usuário remoto (usando uma imagem estática ou vídeo de demonstração)
      if (remoteVideoRef.current && callType === 'video') {
        // Por enquanto, vamos usar uma imagem do avatar como placeholder
        // Em um sistema real, isso seria o stream do usuário remoto
      }

      toast.success('Chamada conectada!')
    } catch (error) {
      console.error('Erro ao acessar mídia:', error)
      toast.error('Erro ao acessar câmera/microfone')
      setCallState('ended')
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleEndCall = () => {
    setCallState('ended')
    
    // Parar streams de mídia
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }

    if (callTimer.current) {
      clearInterval(callTimer.current)
    }

    toast.success(`Chamada finalizada - ${formatDuration(callDuration)}`)
    setTimeout(onClose, 1000)
  }

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled)
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled
      }
    }
  }

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled)
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
      <div 
        className={`bg-gray-900 rounded-xl overflow-hidden shadow-2xl transition-all ${
          isFullscreen 
            ? 'w-full h-full' 
            : 'w-[800px] h-[600px] max-w-[90vw] max-h-[90vh]'
        }`}
      >
        {/* Header */}
        <div className="bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={targetUser.photo} alt={targetUser.name} />
              <AvatarFallback>{targetUser.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-white font-medium">{targetUser.name}</h3>
              <p className="text-gray-400 text-sm">
                {callState === 'connecting' && 'Conectando...'}
                {callState === 'ringing' && 'Chamando...'}
                {callState === 'connected' && `${formatDuration(callDuration)}`}
                {callState === 'ended' && 'Chamada finalizada'}
                {callState === 'declined' && 'Não atendeu'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-gray-400 hover:text-white"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-black">
          {callType === 'video' && callState === 'connected' ? (
            <div className="w-full h-full relative">
              {/* Remote Video (principal) */}
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                {/* Por enquanto, mostrar avatar grande como placeholder */}
                <div className="text-center">
                  <Avatar className="h-32 w-32 mx-auto mb-4">
                    <AvatarImage src={targetUser.photo} alt={targetUser.name} />
                    <AvatarFallback className="text-4xl bg-purple-600 text-white">
                      {targetUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-white text-lg">{targetUser.name}</p>
                  {!isVideoEnabled && (
                    <p className="text-gray-400 text-sm mt-2">Vídeo desativado</p>
                  )}
                </div>
              </div>

              {/* Local Video (picture-in-picture) */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
                />
                {!isVideoEnabled && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile?.photo_url || undefined} alt={profile?.display_name || 'Você'} />
                      <AvatarFallback className="bg-purple-600 text-white">
                        {(profile?.display_name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Audio call ou estados não conectados
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900">
              <div className="text-center">
                <Avatar className="h-32 w-32 mx-auto mb-6">
                  <AvatarImage src={targetUser.photo} alt={targetUser.name} />
                  <AvatarFallback className="text-4xl bg-purple-600 text-white">
                    {targetUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-white text-2xl font-bold mb-2">{targetUser.name}</h2>
                <div className="flex items-center justify-center space-x-2 text-gray-300">
                  {callType === 'video' ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                  <span>
                    {callState === 'connecting' && 'Conectando...'}
                    {callState === 'ringing' && 'Chamando...'}
                    {callState === 'connected' && (callType === 'audio' ? 'Chamada de áudio ativa' : 'Chamada conectada')}
                    {callState === 'ended' && 'Chamada finalizada'}
                    {callState === 'declined' && 'Chamada recusada'}
                  </span>
                </div>
                
                {(callState === 'connecting' || callState === 'ringing') && (
                  <div className="mt-6">
                    <div className="animate-pulse">
                      <div className="w-4 h-4 bg-white rounded-full mx-auto"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {callState === 'connected' && (
          <div className="bg-gray-800 p-4">
            <div className="flex items-center justify-center space-x-4">
              {/* Audio Toggle */}
              <Button
                variant={isAudioEnabled ? "secondary" : "destructive"}
                size="lg"
                onClick={toggleAudio}
                className="rounded-full w-12 h-12"
              >
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>

              {/* Video Toggle (se for chamada de vídeo) */}
              {callType === 'video' && (
                <Button
                  variant={isVideoEnabled ? "secondary" : "destructive"}
                  size="lg"
                  onClick={toggleVideo}
                  className="rounded-full w-12 h-12"
                >
                  {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
              )}

              {/* Speaker Toggle */}
              <Button
                variant={isSpeakerEnabled ? "secondary" : "destructive"}
                size="lg"
                onClick={() => setIsSpeakerEnabled(!isSpeakerEnabled)}
                className="rounded-full w-12 h-12"
              >
                {isSpeakerEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>

              {/* Settings */}
              <Button
                variant="ghost"
                size="lg"
                className="rounded-full w-12 h-12 text-gray-400 hover:text-white"
              >
                <Settings className="h-5 w-5" />
              </Button>

              {/* End Call */}
              <Button
                variant="destructive"
                size="lg"
                onClick={handleEndCall}
                className="rounded-full w-12 h-12 bg-red-600 hover:bg-red-700"
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* End Call para outros estados */}
        {(callState === 'connecting' || callState === 'ringing') && (
          <div className="bg-gray-800 p-4">
            <div className="flex justify-center">
              <Button
                variant="destructive"
                size="lg"
                onClick={handleEndCall}
                className="rounded-full w-12 h-12 bg-red-600 hover:bg-red-700"
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
