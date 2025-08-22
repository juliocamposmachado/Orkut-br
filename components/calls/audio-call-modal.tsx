'use client'

import { useEffect, useState } from 'react'
import { useWebRTC } from '@/contexts/webrtc-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react'

export function AudioCallModal() {
  const {
    callState,
    endCall,
    toggleMute,
    acceptCall,
    rejectCall,
    isMuted
  } = useWebRTC()

  const [callDuration, setCallDuration] = useState(0)
  const [isRinging, setIsRinging] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      const isTouch = 'ontouchstart' in window
      const isSmallScreen = window.innerWidth <= 768
      
      setIsMobile(mobileRegex.test(userAgent) || isTouch || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (callState.callAccepted && callState.isInCall) {
      setIsRinging(false)
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else if (callState.isInCall) {
      setIsRinging(true)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [callState.callAccepted, callState.isInCall])

  // Reset duration when call ends
  useEffect(() => {
    if (!callState.isInCall) {
      setCallDuration(0)
      setIsRinging(true)
    }
  }, [callState.isInCall])

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!callState.isInCall || callState.callType !== 'audio') {
    return null
  }

  // Prevent scrolling on mobile when modal is open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isMobile])

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className={`${
        isMobile 
          ? 'w-full h-full max-w-full max-h-full m-0 p-0 rounded-none border-none'
          : 'sm:max-w-md'
      } bg-white`}>
        {/* Header - only show on desktop or make it smaller on mobile */}
        {!isMobile && (
          <DialogHeader>
            <DialogTitle className="text-center">
              {callState.receivingCall ? 'Chamada Recebida' : 'Chamada de Áudio'}
            </DialogTitle>
          </DialogHeader>
        )}

        <div className={`flex flex-col items-center justify-center ${
          isMobile 
            ? 'h-full w-full px-8 py-16 space-y-8' 
            : 'space-y-6 py-6'
        }`}>
          {/* User Avatar */}
          <div className="relative">
            <Avatar className={`border-4 border-white shadow-lg ${
              isMobile ? 'h-48 w-48' : 'h-32 w-32'
            }`}>
              <AvatarImage 
                src={callState.callingUser?.photo_url} 
                alt={callState.callingUser?.display_name} 
              />
              <AvatarFallback className={`bg-purple-500 text-white ${
                isMobile ? 'text-4xl' : 'text-2xl'
              }`}>
                {callState.callingUser?.display_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Ringing animation */}
            {isRinging && (
              <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping" />
            )}
          </div>

          {/* User Info */}
          <div className="text-center">
            <h3 className={`font-semibold text-gray-800 mb-1 ${
              isMobile ? 'text-3xl' : 'text-xl'
            }`}>
              {callState.callingUser?.display_name}
            </h3>
            <p className={`text-gray-600 mb-2 ${
              isMobile ? 'text-lg' : 'text-sm'
            }`}>
              @{callState.callingUser?.username}
            </p>
            
            {/* Call Status */}
            <div className="flex justify-center">
              {callState.receivingCall ? (
                <Badge variant="default" className={`bg-blue-500 ${
                  isMobile ? 'text-lg px-4 py-2' : 'text-sm px-2 py-1'
                }`}>
                  📞 {isMobile ? 'Chamada recebida' : 'Chamada recebida'}
                </Badge>
              ) : callState.callAccepted ? (
                <Badge variant="default" className={`bg-green-500 ${
                  isMobile ? 'text-lg px-4 py-2' : 'text-sm px-2 py-1'
                }`}>
                  ⏱️ {formatDuration(callDuration)}
                </Badge>
              ) : (
                <Badge variant="default" className={`bg-yellow-500 animate-pulse ${
                  isMobile ? 'text-lg px-4 py-2' : 'text-sm px-2 py-1'
                }`}>
                  🔄 {isMobile ? 'Conectando' : 'Chamando...'}
                </Badge>
              )}
            </div>
          </div>

          {/* Audio Visualization */}
          {callState.callAccepted && (
            <div className={`flex items-center ${
              isMobile ? 'space-x-4' : 'space-x-2'
            }`}>
              <Volume2 className={`text-green-500 ${
                isMobile ? 'h-8 w-8' : 'h-5 w-5'
              }`} />
              <div className={`flex ${
                isMobile ? 'space-x-2' : 'space-x-1'
              }`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`bg-green-500 rounded-full animate-pulse ${
                      isMobile ? 'w-2' : 'w-1'
                    }`}
                    style={{
                      height: Math.random() * (isMobile ? 32 : 20) + (isMobile ? 16 : 10),
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Call Controls */}
          <div className={`flex items-center justify-center ${
            isMobile ? 'space-x-6' : 'space-x-4'
          }`}>
            {callState.receivingCall ? (
              // Incoming call controls
              <>
                <Button
                  onClick={rejectCall}
                  size="lg"
                  className={`rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white transition-colors ${
                    isMobile ? 'w-20 h-20' : 'w-16 h-16'
                  }`}
                  style={{
                    minHeight: isMobile ? '80px' : undefined,
                    minWidth: isMobile ? '80px' : undefined
                  }}
                >
                  <PhoneOff className={isMobile ? 'h-8 w-8' : 'h-6 w-6'} />
                </Button>
                
                <Button
                  onClick={acceptCall}
                  size="lg"
                  className={`rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white transition-colors ${
                    isMobile ? 'w-20 h-20' : 'w-16 h-16'
                  }`}
                  style={{
                    minHeight: isMobile ? '80px' : undefined,
                    minWidth: isMobile ? '80px' : undefined
                  }}
                >
                  <Phone className={isMobile ? 'h-8 w-8' : 'h-6 w-6'} />
                </Button>
              </>
            ) : (
              // Active call controls
              <>
                <Button
                  onClick={toggleMute}
                  size="lg"
                  variant={isMuted ? "default" : "outline"}
                  className={`rounded-full transition-colors ${
                    isMobile ? 'w-16 h-16' : 'w-14 h-14'
                  } ${
                    isMuted 
                      ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white' 
                      : 'border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                  style={{
                    minHeight: isMobile ? '64px' : undefined,
                    minWidth: isMobile ? '64px' : undefined
                  }}
                >
                  {isMuted ? (
                    <MicOff className={isMobile ? 'h-6 w-6' : 'h-5 w-5'} />
                  ) : (
                    <Mic className={isMobile ? 'h-6 w-6' : 'h-5 w-5'} />
                  )}
                </Button>

                <Button
                  onClick={endCall}
                  size="lg"
                  className={`rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white transition-colors ${
                    isMobile ? 'w-20 h-20' : 'w-16 h-16'
                  }`}
                  style={{
                    minHeight: isMobile ? '80px' : undefined,
                    minWidth: isMobile ? '80px' : undefined
                  }}
                >
                  <PhoneOff className={isMobile ? 'h-8 w-8' : 'h-6 w-6'} />
                </Button>
              </>
            )}
          </div>

          {/* Status Text */}
          <div className="text-center max-w-xs">
            {callState.receivingCall ? (
              <p className={`text-gray-600 ${
                isMobile ? 'text-lg' : 'text-sm'
              }`}>
                {isMobile ? 'Aceitar ou rejeitar a chamada' : 'Toque em ✅ para aceitar ou ❌ para rejeitar'}
              </p>
            ) : callState.callAccepted ? (
              <p className={`text-gray-600 ${
                isMobile ? 'text-lg' : 'text-sm'
              }`}>
                {isMuted ? '🔇 Microfone desligado' : '🎤 Microfone ligado'}
              </p>
            ) : (
              <p className={`text-gray-600 animate-pulse ${
                isMobile ? 'text-lg' : 'text-sm'
              }`}>
                {isMobile ? 'Conectando...' : 'Estabelecendo conexão...'}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
