"use client"

import React from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useCall } from '@/contexts/CallContext'
import { motion, AnimatePresence } from 'framer-motion'

export const CallNotificationOverlay: React.FC = () => {
  const { 
    currentCall, 
    targetUser, 
    callType,
    isInCall,
    hasIncomingCall,
    isConnecting,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    error
  } = useCall()

  if (!currentCall && !hasIncomingCall && !isConnecting && !error) {
    return null
  }

  // Chamada recebida
  if (hasIncomingCall && currentCall?.status === 'ringing') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          className="fixed top-4 right-4 z-50"
        >
          <Card className="p-6 bg-white shadow-2xl border-2 border-blue-200 max-w-sm">
            <div className="flex flex-col items-center space-y-4">
              {/* Avatar do usuário chamando */}
              <div className="relative">
                <Avatar className="w-16 h-16 ring-4 ring-blue-500 ring-opacity-50">
                  <AvatarImage src={targetUser?.photo} />
                  <AvatarFallback className="bg-blue-500 text-white text-xl font-semibold">
                    {targetUser?.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute -top-2 -right-2"
                >
                  <div className="bg-green-500 w-6 h-6 rounded-full flex items-center justify-center">
                    <Phone className="w-3 h-3 text-white" />
                  </div>
                </motion.div>
              </div>

              {/* Informações da chamada */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {targetUser?.name || 'Usuário desconhecido'}
                </h3>
                <p className="text-sm text-gray-600">
                  Chamada de {callType === 'video' ? 'vídeo' : 'áudio'} recebida
                </p>
              </div>

              {/* Botões de ação */}
              <div className="flex space-x-4">
                <Button
                  onClick={rejectCall}
                  variant="outline"
                  size="lg"
                  className="bg-red-500 hover:bg-red-600 text-white border-red-500 w-14 h-14 rounded-full p-0"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
                <Button
                  onClick={acceptCall}
                  size="lg"
                  className="bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full p-0"
                >
                  <Phone className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Conectando
  if (isConnecting || currentCall?.status === 'calling') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50"
        >
          <Card className="p-4 bg-white shadow-lg border max-w-sm">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={targetUser?.photo} />
                <AvatarFallback>
                  {targetUser?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {targetUser?.name || 'Usuário'}
                </p>
                <p className="text-xs text-gray-600">
                  {isConnecting ? 'Conectando...' : 'Chamando...'}
                </p>
              </div>

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-6 h-6"
              >
                <Phone className="w-full h-full text-blue-500" />
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Chamada ativa
  if (isInCall && currentCall?.status === 'connected') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50"
        >
          <Card className="p-4 bg-white shadow-lg border max-w-sm">
            <div className="flex flex-col space-y-3">
              {/* Header da chamada */}
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={targetUser?.photo} />
                  <AvatarFallback>
                    {targetUser?.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {targetUser?.name || 'Usuário'}
                  </p>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-xs text-gray-600">Em chamada</p>
                  </div>
                </div>

                <Button
                  onClick={endCall}
                  variant="outline"
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white border-red-500 w-8 h-8 p-0 rounded-full"
                >
                  <PhoneOff className="w-4 h-4" />
                </Button>
              </div>

              {/* Controles da chamada */}
              <div className="flex items-center justify-center space-x-2">
                <Button
                  onClick={toggleMute}
                  variant="outline"
                  size="sm"
                  className={`w-8 h-8 p-0 rounded-full ${
                    currentCall?.isMuted
                      ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {currentCall?.isMuted ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>

                {callType === 'video' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0 rounded-full hover:bg-gray-100"
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Erro
  if (error) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed top-4 right-4 z-50"
        >
          <Card className="p-4 bg-red-50 border-red-200 max-w-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <PhoneOff className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Erro na chamada
                </p>
                <p className="text-xs text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  return null
}

// Componente de overlay em tela cheia para chamadas de vídeo
export const VideoCallOverlay: React.FC = () => {
  const { 
    currentCall, 
    targetUser, 
    callType,
    isInCall,
    endCall,
    toggleMute
  } = useCall()

  if (!isInCall || callType !== 'video' || currentCall?.status !== 'connected') {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex flex-col"
      >
        {/* Video remoto (tela cheia) */}
        <div className="flex-1 relative">
          <video
            ref={(video) => {
              if (video && currentCall?.remoteStream) {
                video.srcObject = currentCall.remoteStream
              }
            }}
            autoPlay
            className="w-full h-full object-cover"
          />
          
          {/* Video local (picture-in-picture) */}
          <div className="absolute top-4 right-4 w-32 h-24 bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={(video) => {
                if (video && currentCall?.localStream) {
                  video.srcObject = currentCall.localStream
                }
              }}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* Informações do usuário */}
          <div className="absolute top-4 left-4 flex items-center space-x-3">
            <Avatar className="w-10 h-10 ring-2 ring-white">
              <AvatarImage src={targetUser?.photo} />
              <AvatarFallback>
                {targetUser?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-medium">
                {targetUser?.name || 'Usuário'}
              </p>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-white text-sm">Em chamada</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="p-6 bg-black bg-opacity-50">
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={toggleMute}
              variant="outline"
              className={`w-12 h-12 rounded-full ${
                currentCall?.isMuted
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                  : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30'
              }`}
            >
              {currentCall?.isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>

            <Button
              onClick={endCall}
              className="bg-red-500 hover:bg-red-600 text-white w-12 h-12 rounded-full"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CallNotificationOverlay
