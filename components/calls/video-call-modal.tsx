'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWebRTC } from '@/contexts/webrtc-context'
import { Dialog, DialogContent } from '@/components/ui/dialog'
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
  Monitor,
  MonitorOff,
  Maximize2,
  Minimize2
} from 'lucide-react'

export function VideoCallModal() {
  const {
    callState,
    endCall,
    toggleMute,
    toggleVideo,
    acceptCall,
    rejectCall,
    isMuted,
    isVideoEnabled,
    localVideoRef,
    remoteVideoRef
  } = useWebRTC()

  const [callDuration, setCallDuration] = useState(0)
  const [isRinging, setIsRinging] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const startScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing and return to camera
        setIsScreenSharing(false)
        // Implementation would replace screen stream with camera stream
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        })
        setIsScreenSharing(true)
        
        // Implementation would replace camera stream with screen stream
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
        }
      }
    } catch (error) {
      console.error('Error with screen sharing:', error)
    }
  }

  if (!callState.isInCall || callState.callType !== 'video') {
    return null
  }

  // Prevent scrolling on mobile when modal is open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.height = '100%'
      
      return () => {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.width = ''
        document.body.style.height = ''
      }
    }
  }, [isMobile])

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent 
        className={`${
          isMobile || isFullscreen 
            ? 'max-w-full max-h-full w-screen h-screen p-0 m-0 fixed inset-0' 
            : 'w-full h-full max-w-full max-h-full sm:max-w-4xl sm:max-h-[80vh] p-0 sm:p-6'
        } bg-black text-white overflow-hidden border-none`}
        style={{
          // Mobile: tela cheia sempre
          width: isMobile ? '100vw' : undefined,
          height: isMobile ? '100vh' : undefined,
          maxWidth: isMobile ? '100vw' : undefined,
          maxHeight: isMobile ? '100vh' : undefined,
          // Evita problemas com safe areas no mobile
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : undefined,
          paddingTop: isMobile ? 'env(safe-area-inset-top)' : undefined
        }}
      >
        <div className="relative w-full h-full flex flex-col">
          
          {/* Header with user info and call status */}
          {!callState.callAccepted && (
            <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-20 ${
              isMobile ? 'top-8 px-2' : 'top-4'
            }`}>
              <div className="bg-black bg-opacity-70 rounded-lg px-4 py-3 text-center">
                <h3 className={`font-semibold text-white mb-1 ${
                  isMobile ? 'text-xl' : 'text-lg'
                }`}>
                  {callState.receivingCall ? 'Chamada Recebida' : 'Chamando...'}
                </h3>
                <p className={`text-gray-300 ${
                  isMobile ? 'text-base' : 'text-sm'
                }`}>
                  {callState.callingUser?.display_name}
                </p>
                {callState.receivingCall ? (
                  <Badge variant="default" className="bg-blue-500 mt-2 text-sm">
                    📹 Chamada de vídeo
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-yellow-500 animate-pulse mt-2 text-sm">
                    🔄 Conectando...
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Call duration when connected */}
          {callState.callAccepted && (
            <div className={`absolute top-4 left-4 z-20 ${
              isMobile ? 'top-6' : 'top-4'
            }`}>
              <Badge variant="default" className={`bg-green-500 ${
                isMobile ? 'text-base px-3 py-1' : 'text-sm px-2 py-1'
              }`}>
                ⏱️ {formatDuration(callDuration)}
              </Badge>
            </div>
          )}

          {/* Fullscreen toggle - Hidden on mobile since it's always fullscreen */}
          {!isMobile && (
            <Button
              onClick={toggleFullscreen}
              size="sm"
              variant="ghost"
              className="absolute top-4 right-4 z-20 text-white hover:bg-white hover:bg-opacity-20"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Video Container */}
          <div className="flex-1 relative">
            
            {/* Remote Video (Full Screen) */}
            <div className="w-full h-full relative bg-gray-900">
              {callState.callAccepted && callState.remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                // Placeholder when no remote video
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Avatar className={`border-4 border-white shadow-lg mx-auto mb-4 ${
                      isMobile ? 'h-40 w-40' : 'h-32 w-32'
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
                    
                    {isRinging && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`rounded-full border-4 border-green-400 animate-ping ${
                          isMobile ? 'w-40 h-40' : 'w-32 h-32'
                        }`} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Local Video (Picture in Picture) */}
              {callState.localStream && (
                <div className={`absolute bottom-4 right-4 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg ${
                  isMobile 
                    ? 'w-32 h-44 bottom-32 right-2' 
                    : 'w-48 h-36'
                }`}>
                  {isVideoEnabled ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                      <VideoOff className={isMobile ? 'h-6 w-6 text-gray-400' : 'h-8 w-8 text-gray-400'} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Call Controls */}
          <div className={`absolute left-1/2 transform -translate-x-1/2 z-20 ${
            isMobile ? 'bottom-4' : 'bottom-8'
          }`}>
            <div className={`bg-black bg-opacity-70 rounded-full px-6 py-4 flex items-center ${
              isMobile ? 'space-x-3' : 'space-x-4'
            }`}>
              
              {callState.receivingCall ? (
                // Incoming call controls
                <>
                  <Button
                    onClick={rejectCall}
                    size="lg"
                    className={`rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white transition-colors ${
                      isMobile ? 'w-20 h-20 text-lg' : 'w-16 h-16'
                    }`}
                    style={{
                      // Touch-friendly size on mobile
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
                      isMobile ? 'w-20 h-20 text-lg' : 'w-16 h-16'
                    }`}
                    style={{
                      // Touch-friendly size on mobile
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
                  {/* Mute/Unmute */}
                  <Button
                    onClick={toggleMute}
                    size="lg"
                    variant="ghost"
                    className={`rounded-full transition-colors ${
                      isMobile ? 'w-14 h-14' : 'w-12 h-12'
                    } ${
                      isMuted 
                        ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white' 
                        : 'bg-white bg-opacity-20 hover:bg-opacity-30 active:bg-opacity-40 text-white'
                    }`}
                    style={{
                      minHeight: isMobile ? '56px' : undefined,
                      minWidth: isMobile ? '56px' : undefined
                    }}
                  >
                    {isMuted ? (
                      <MicOff className={isMobile ? 'h-6 w-6' : 'h-5 w-5'} />
                    ) : (
                      <Mic className={isMobile ? 'h-6 w-6' : 'h-5 w-5'} />
                    )}
                  </Button>

                  {/* Video On/Off */}
                  <Button
                    onClick={toggleVideo}
                    size="lg"
                    variant="ghost"
                    className={`rounded-full transition-colors ${
                      isMobile ? 'w-14 h-14' : 'w-12 h-12'
                    } ${
                      !isVideoEnabled 
                        ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white' 
                        : 'bg-white bg-opacity-20 hover:bg-opacity-30 active:bg-opacity-40 text-white'
                    }`}
                    style={{
                      minHeight: isMobile ? '56px' : undefined,
                      minWidth: isMobile ? '56px' : undefined
                    }}
                  >
                    {isVideoEnabled ? (
                      <Video className={isMobile ? 'h-6 w-6' : 'h-5 w-5'} />
                    ) : (
                      <VideoOff className={isMobile ? 'h-6 w-6' : 'h-5 w-5'} />
                    )}
                  </Button>

                  {/* Screen Share - Hidden on mobile for space */}
                  {!isMobile && (
                    <Button
                      onClick={startScreenShare}
                      size="lg"
                      variant="ghost"
                      className={`rounded-full w-12 h-12 transition-colors ${
                        isScreenSharing 
                          ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white' 
                          : 'bg-white bg-opacity-20 hover:bg-opacity-30 active:bg-opacity-40 text-white'
                      }`}
                    >
                      {isScreenSharing ? (
                        <MonitorOff className="h-5 w-5" />
                      ) : (
                        <Monitor className="h-5 w-5" />
                      )}
                    </Button>
                  )}

                  {/* End Call */}
                  <Button
                    onClick={endCall}
                    size="lg"
                    className={`rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white transition-colors ${
                      isMobile ? 'w-18 h-18' : 'w-16 h-16'
                    }`}
                    style={{
                      minHeight: isMobile ? '72px' : undefined,
                      minWidth: isMobile ? '72px' : undefined
                    }}
                  >
                    <PhoneOff className={isMobile ? 'h-7 w-7' : 'h-6 w-6'} />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Status indicators */}
          <div className={`absolute left-4 z-20 space-y-2 ${
            isMobile ? 'bottom-28' : 'bottom-24'
          }`}>
            {isMuted && (
              <Badge variant="destructive" className={`bg-red-500 ${
                isMobile ? 'text-base px-3 py-1' : 'text-sm px-2 py-1'
              }`}>
                🔇 {isMobile ? 'Mudo' : 'Microfone desligado'}
              </Badge>
            )}
            {!isVideoEnabled && (
              <Badge variant="destructive" className={`bg-red-500 ${
                isMobile ? 'text-base px-3 py-1' : 'text-sm px-2 py-1'
              }`}>
                📷 {isMobile ? 'Sem vídeo' : 'Câmera desligada'}
              </Badge>
            )}
            {isScreenSharing && (
              <Badge variant="default" className={`bg-blue-500 ${
                isMobile ? 'text-base px-3 py-1' : 'text-sm px-2 py-1'
              }`}>
                🖥️ {isMobile ? 'Tela' : 'Compartilhando tela'}
              </Badge>
            )}
          </div>

          {/* Connection status */}
          {!callState.callAccepted && !callState.receivingCall && (
            <div className={`absolute right-4 z-20 ${
              isMobile ? 'bottom-28' : 'bottom-24'
            }`}>
              <Badge variant="default" className={`bg-yellow-500 animate-pulse ${
                isMobile ? 'text-base px-3 py-1' : 'text-sm px-2 py-1'
              }`}>
                {isMobile ? '🔄 Conectando' : 'Conectando...'}
              </Badge>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
