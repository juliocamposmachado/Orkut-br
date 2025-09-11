'use client'

import { useState, useEffect, useRef } from 'react'
import { useCallNotifications } from '@/hooks/use-call-notifications'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Speaker,
  Settings
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface RealCallInterfaceProps {
  callType: 'audio' | 'video'
  remoteUserInfo: {
    username: string
    display_name: string
    photo_url?: string
  }
  onEndCall: () => void
}

export function RealCallInterface({ callType, remoteUserInfo, onEndCall }: RealCallInterfaceProps) {
  const { 
    localStream, 
    remoteStream, 
    toggleMicrophone, 
    toggleCamera,
    endCall 
  } = useCallNotifications()
  
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout>()

  // Timer para duração da chamada
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Configurar stream local
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      try {
        localVideoRef.current.srcObject = localStream
        console.log('📹 Stream local configurado:', {
          id: localStream.id,
          videoTracks: localStream.getVideoTracks().length,
          audioTracks: localStream.getAudioTracks().length
        })
      } catch (error) {
        console.error('❌ Erro ao configurar stream local:', error)
      }
    }
  }, [localStream])

  // Configurar stream remoto
  useEffect(() => {
    if (remoteStream) {
      try {
        if (callType === 'video' && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
          console.log('📹 Stream remoto configurado (vídeo):', {
            id: remoteStream.id,
            videoTracks: remoteStream.getVideoTracks().length,
            audioTracks: remoteStream.getAudioTracks().length
          })
        } else if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream
          console.log('🔊 Stream remoto configurado (áudio):', {
            id: remoteStream.id,
            audioTracks: remoteStream.getAudioTracks().length
          })
        }
      } catch (error) {
        console.error('❌ Erro ao configurar stream remoto:', error)
      }
    }
  }, [remoteStream, callType])

  // Auto-hide controls em chamadas de vídeo
  useEffect(() => {
    if (callType === 'video') {
      const resetTimeout = () => {
        setShowControls(true)
        clearTimeout(hideControlsTimeoutRef.current)
        hideControlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false)
        }, 3000)
      }

      resetTimeout()
      return () => clearTimeout(hideControlsTimeoutRef.current)
    }
  }, [callType])

  const handleToggleMicrophone = () => {
    try {
      const newState = toggleMicrophone()
      setIsMicMuted(!newState)
      console.log('🎤 Microfone:', newState ? 'ligado' : 'desligado')
      
      // Feedback visual adicional
      if (newState) {
        toast.info('Microfone ligado')
      } else {
        toast.info('Microfone desligado')
      }
    } catch (error) {
      console.error('❌ Erro ao alternar microfone:', error)
      toast.error('Erro ao controlar microfone')
    }
  }

  const handleToggleCamera = () => {
    if (callType === 'video') {
      try {
        const newState = toggleCamera()
        setIsCameraOff(!newState)
        console.log('📹 Câmera:', newState ? 'ligada' : 'desligada')
        
        // Feedback visual adicional
        if (newState) {
          toast.info('Câmera ligada')
        } else {
          toast.info('Câmera desligada')
        }
      } catch (error) {
        console.error('❌ Erro ao alternar câmera:', error)
        toast.error('Erro ao controlar câmera')
      }
    }
  }

  const handleEndCall = async () => {
    console.log('☎️ Usuário encerrou a chamada')
    try {
      await endCall()
      onEndCall()
    } catch (error) {
      console.error('❌ Erro ao encerrar chamada:', error)
      // Forçar encerramento mesmo com erro
      onEndCall()
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (callType === 'video') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
        onMouseMove={() => setShowControls(true)}
      >
        {/* Stream de vídeo remoto (tela principal) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Stream de vídeo local (picture-in-picture) */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20"
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {isCameraOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <Avatar className="w-16 h-16">
                <AvatarFallback>Eu</AvatarFallback>
              </Avatar>
            </div>
          )}
        </motion.div>

        {/* Informações do usuário remoto */}
        <AnimatePresence>
          {(showControls || !remoteStream) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 text-white"
            >
              <div className="flex items-center space-x-3 mb-2">
                <Avatar className="w-12 h-12 border-2 border-white/30">
                  <AvatarImage src={remoteUserInfo.photo_url} />
                  <AvatarFallback className="bg-gray-700 text-white">
                    {remoteUserInfo.display_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{remoteUserInfo.display_name}</h3>
                  <p className="text-sm text-gray-300">@{remoteUserInfo.username}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-500/80 text-white">
                <Video className="w-4 h-4 mr-1" />
                Chamada de Vídeo • {formatDuration(callDuration)}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controles de chamada */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <div className="flex items-center space-x-4 bg-black/50 backdrop-blur-sm rounded-full px-6 py-4">
                {/* Microfone */}
                <Button
                  onClick={handleToggleMicrophone}
                  size="lg"
                  className={`w-14 h-14 rounded-full ${
                    isMicMuted 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>

                {/* Câmera */}
                <Button
                  onClick={handleToggleCamera}
                  size="lg"
                  className={`w-14 h-14 rounded-full ${
                    isCameraOff 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </Button>

                {/* Encerrar chamada */}
                <Button
                  onClick={handleEndCall}
                  size="lg"
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Áudio remoto (sempre presente) */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          className="hidden"
        />
      </motion.div>
    )
  }

  // Interface para chamadas de áudio
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900"
    >
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md mx-4 text-center text-white">
        {/* Avatar e info do usuário */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-6"
        >
          <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-white/30">
            <AvatarImage src={remoteUserInfo.photo_url} />
            <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-400 to-pink-400">
              {remoteUserInfo.display_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <h3 className="text-2xl font-bold mb-1">{remoteUserInfo.display_name}</h3>
          <p className="text-gray-300 mb-4">@{remoteUserInfo.username}</p>
          
          <Badge variant="secondary" className="bg-green-500/80 text-white mb-4">
            <Phone className="w-4 h-4 mr-1" />
            Chamada de Áudio • {formatDuration(callDuration)}
          </Badge>
        </motion.div>

        {/* Indicadores de status */}
        <div className="flex justify-center space-x-6 mb-8">
          <div className="text-center">
            <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${
              isMicMuted ? 'bg-red-500' : 'bg-green-500'
            }`} />
            <span className="text-xs">Microfone</span>
          </div>
          
          <motion.div 
            className="text-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-4 h-4 rounded-full mx-auto mb-1 bg-blue-500" />
            <span className="text-xs">Conectado</span>
          </motion.div>
        </div>

        {/* Controles de chamada */}
        <div className="flex justify-center space-x-6">
          {/* Microfone */}
          <Button
            onClick={handleToggleMicrophone}
            size="lg"
            className={`w-16 h-16 rounded-full ${
              isMicMuted 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isMicMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </Button>

          {/* Encerrar chamada */}
          <Button
            onClick={handleEndCall}
            size="lg"
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="w-7 h-7" />
          </Button>
        </div>

        {/* Áudio remoto */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          className="hidden"
        />
      </div>
    </motion.div>
  )
}
