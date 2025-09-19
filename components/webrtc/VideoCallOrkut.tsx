'use client';
// Updated for Vercel deployment - 2025-09-19
import { useRef, useEffect, useState } from 'react';
// import { useWebRTCChamadas } from '@/hooks/useWebRTCChamadas';
// Simplified version for Vercel deployment
import CallControlsOrkut from './CallControlsOrkut';
import UserInvitePanel from './UserInvitePanel';
import CallChat from './CallChat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Copy, 
  Share2, 
  Users, 
  User,
  AlertTriangle,
  UserPlus 
} from 'lucide-react';
import { toast } from 'sonner';

interface VideoCallOrkutProps {
  roomId: string;
  userId: string;
  onLeaveRoom: () => void;
  callType?: 'individual' | 'group';
  isHost?: boolean;
}

export default function VideoCallOrkut({ 
  roomId, 
  userId, 
  onLeaveRoom,
  callType = 'individual',
  isHost = false
}: VideoCallOrkutProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isInvitePanelOpen, setIsInvitePanelOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Simplified state for Vercel deployment
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connecting' | 'connected' | 'disconnected'>('idle')
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Simplified WebRTC functions
  const createOffer = async () => {
    setCallState('calling')
    toast.info('🔌 Função de chamada ainda em desenvolvimento')
  }

  const answerCall = () => {
    setCallState('connecting')
    toast.success('✅ Chamada simulada')
  }

  const rejectCall = () => {
    setCallState('idle')
    toast.info('❌ Chamada rejeitada')
  }

  const hangup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    setLocalStream(null)
    setCallState('idle')
    toast.info('📞 Chamada encerrada')
  }

  const toggleAudioMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = isAudioMuted
      })
    }
    setIsAudioMuted(!isAudioMuted)
    toast.info(`🎤 Microfone ${isAudioMuted ? 'ligado' : 'desligado'}`)
  }

  const toggleVideoMute = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = isVideoMuted
      })
    }
    setIsVideoMuted(!isVideoMuted)
    toast.info(`📹 Câmera ${isVideoMuted ? 'ligada' : 'desligada'}`)
  }

  // Initialize media on mount
  useEffect(() => {
    const initMedia = async () => {
      if (typeof window === 'undefined') return
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
        setLocalStream(stream)
        setIsInitialized(true)
        toast.success('📹 Câmera e microfone ativados')
      } catch (err) {
        setError('Não foi possível acessar câmera e microfone')
        toast.error('❌ Erro ao acessar mídia')
      }
    }

    initMedia()

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleLeaveRoom = () => {
    hangup();
    onLeaveRoom();
  };

  const copyRoomLink = () => {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/chamadas/${roomId}`;
      navigator.clipboard.writeText(link);
      toast.success('📋 Link da sala copiado!');
    }
  };

  const shareRoom = () => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Orkut - Chamada de Vídeo',
        text: 'Junte-se à minha chamada de vídeo no Orkut!',
        url: `${window.location.origin}/chamadas/${roomId}`,
      });
    } else {
      copyRoomLink();
    }
  };

  const getCallStateMessage = () => {
    switch (callState) {
      case 'idle':
        return isHost ? 'Online - Aguardando participantes' : 'Pronto para entrar';
      case 'calling':
        return isHost ? 'Aguardando participante...' : 'Entrando na sala...';
      case 'receiving':
        return 'Participante quer entrar';
      case 'connecting':
        return 'Conectando...';
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return isHost ? 'Transmissão encerrada' : 'Desconectado da sala';
      case 'failed':
        return 'Falha na conexão';
      default:
        return '';
    }
  };

  const getCallStateColor = () => {
    switch (callState) {
      case 'connected':
        return 'bg-green-500';
      case 'calling':
      case 'connecting':
        return 'bg-yellow-500';
      case 'receiving':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      case 'disconnected':
        return 'bg-gray-500';
      default:
        return 'bg-purple-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 to-pink-800 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleLeaveRoom}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Sair
            </Button>
            
            <div>
              <div className="flex items-center space-x-2">
                <Badge 
                  className={`${getCallStateColor()} text-white border-none`}
                >
                  <div className={`w-2 h-2 rounded-full bg-white mr-2 ${
                    callState === 'connected' ? 'animate-pulse' : ''
                  }`} />
                  {getCallStateMessage()}
                </Badge>
                
                <Badge 
                  variant="outline" 
                  className="border-white/30 text-white"
                >
                  {callType === 'individual' ? (
                    <>
                      <User className="h-3 w-3 mr-1" />
                      Individual
                    </>
                  ) : (
                    <>
                      <Users className="h-3 w-3 mr-1" />
                      Grupo
                    </>
                  )}
                </Badge>
              </div>
              
              <div className="text-white/80 text-sm mt-1">
                ID da Sala: <span className="font-mono">{roomId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsInvitePanelOpen(true)}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar
            </Button>
            
            <Button
              onClick={copyRoomLink}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
            
            <Button
              onClick={shareRoom}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-600 text-white p-4 shadow-md">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Erro:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Video Container */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Remote Video (Main) */}
        <div className="flex-1 bg-black/50 backdrop-blur-sm rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <p className="text-xl font-medium mb-2">
                  {callState === 'idle' ? 
                    (isHost ? 'Você está online!' : 'Aguardando conexão') : 
                    'Sem vídeo remoto'
                  }
                </p>
                <p className="text-white/60 text-sm">
                  {callState === 'idle' && (
                    isHost ? 
                      'Compartilhe o ID da sala para outros entrarem' : 
                      'Clique em "Entrar na Sala" para começar'
                  )}
                </p>
              </div>
            </div>
          )}
          
          {/* Connection Status Overlay */}
          {(callState === 'calling' || callState === 'connecting') && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg font-medium">
                  {callState === 'calling' ? 'Chamando...' : 'Conectando...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="lg:w-80 lg:h-60 w-full h-48 bg-black/50 backdrop-blur-sm rounded-2xl overflow-hidden relative border border-white/10 shadow-xl">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3-3 1.34-3 3zm3-8C6.48 4 2 8.48 2 14s4.48 10 10 10 10-4.48 10-10S17.52 4 12 4z"/>
                  </svg>
                </div>
                <p className="text-sm font-medium">Você</p>
              </div>
            </div>
          )}
          
          {/* Video Muted Overlay */}
          {isVideoMuted && localStream && (
            <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
              <div className="text-center text-white">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                </svg>
                <p className="text-xs">Câmera desligada</p>
              </div>
            </div>
          )}
          
          {/* Audio Muted Indicator */}
          {isAudioMuted && (
            <div className="absolute top-2 right-2 bg-red-600 rounded-full p-1">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Call Controls */}
      <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm p-6">
        <CallControlsOrkut
          isAudioMuted={isAudioMuted}
          isVideoMuted={isVideoMuted}
          isConnected={callState === 'connected'}
          onToggleAudio={toggleAudioMute}
          onToggleVideo={toggleVideoMute}
          onHangup={hangup}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
        />
      </div>
      
      {/* User Invite Panel */}
      <UserInvitePanel
        roomId={roomId}
        isOpen={isInvitePanelOpen}
        onClose={() => setIsInvitePanelOpen(false)}
      />
      
      {/* Chat da Sala */}
      <CallChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUserId={userId}
        currentUserName="Você"
      />
    </div>
  );
}
