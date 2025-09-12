import { useRef, useCallback, useState, useEffect } from 'react'

export interface CallState {
  isCallActive: boolean
  isConnecting: boolean
  isIncomingCall: boolean
  isOutgoingCall: boolean
  callType: 'audio' | 'video' | null
  remoteUserId: string | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
}

export interface WebRTCConnection {
  callState: CallState
  localVideoRef: React.RefObject<HTMLVideoElement>
  remoteVideoRef: React.RefObject<HTMLVideoElement>
  initiateCall: (userId: string, type: 'audio' | 'video') => Promise<void>
  acceptCall: () => Promise<void>
  rejectCall: () => void
  endCall: () => void
  toggleMute: () => void
  toggleVideo: () => void
  isMuted: boolean
  isVideoEnabled: boolean
  connectionState: RTCPeerConnectionState
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
]

export const useWebRTC = (
  onOfferCreated: (offer: RTCSessionDescriptionInit, targetUserId: string, callType: 'audio' | 'video') => void,
  onAnswerCreated: (answer: RTCSessionDescriptionInit, targetUserId: string) => void,
  onIceCandidateGenerated: (candidate: RTCIceCandidateInit, targetUserId: string) => void,
  onCallStateChanged: (state: CallState) => void
): WebRTCConnection => {
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  
  const [callState, setCallState] = useState<CallState>({
    isCallActive: false,
    isConnecting: false,
    isIncomingCall: false,
    isOutgoingCall: false,
    callType: null,
    remoteUserId: null,
    localStream: null,
    remoteStream: null
  })

  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new')

  // Inicializar conexão WebRTC
  const initializePeerConnection = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close()
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    
    // Manipular mudanças de estado da conexão
    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState)
      setConnectionState(pc.connectionState)
      
      if (pc.connectionState === 'connected') {
        console.log('✅ WebRTC conectado com sucesso!')
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.log('❌ Conexão WebRTC falhou')
        endCall()
      }
    }

    // Manipular stream remoto
    pc.ontrack = (event) => {
      console.log('📺 Stream remoto recebido:', event.streams[0])
      const remoteStream = event.streams[0]
      
      setCallState(prev => ({ ...prev, remoteStream }))
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream
      }
    }

    // Manipular ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && callState.remoteUserId) {
        console.log('🧊 ICE candidate gerado:', event.candidate)
        onIceCandidateGenerated(event.candidate.toJSON(), callState.remoteUserId)
      }
    }

    peerConnection.current = pc
  }, [callState.remoteUserId, onIceCandidateGenerated])

  // Obter stream do usuário
  const getUserMedia = useCallback(async (audio: boolean, video: boolean): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio, 
        video: video ? { width: 1280, height: 720 } : false 
      })
      
      console.log('🎤 Stream do usuário obtido:', { audio, video })
      return stream
    } catch (error) {
      console.error('❌ Erro ao obter stream:', error)
      throw new Error('Não foi possível acessar câmera/microfone')
    }
  }, [])

  // Iniciar chamada
  const initiateCall = useCallback(async (userId: string, type: 'audio' | 'video') => {
    try {
      console.log(`📞 Iniciando chamada ${type} para:`, userId)
      
      initializePeerConnection()
      
      const stream = await getUserMedia(true, type === 'video')
      
      // Adicionar stream à conexão
      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream)
      })

      // Atualizar estado
      const newState: CallState = {
        isCallActive: false,
        isConnecting: true,
        isIncomingCall: false,
        isOutgoingCall: true,
        callType: type,
        remoteUserId: userId,
        localStream: stream,
        remoteStream: null
      }
      
      setCallState(newState)
      onCallStateChanged(newState)

      // Mostrar stream local
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Criar oferta
      const offer = await peerConnection.current!.createOffer()
      await peerConnection.current!.setLocalDescription(offer)
      
      console.log('📤 Oferta criada e enviada')
      onOfferCreated(offer, userId, type)

    } catch (error) {
      console.error('❌ Erro ao iniciar chamada:', error)
      endCall()
    }
  }, [initializePeerConnection, getUserMedia, onOfferCreated, onCallStateChanged])

  // Aceitar chamada
  const acceptCall = useCallback(async () => {
    if (!callState.isIncomingCall || !peerConnection.current || !callState.callType) {
      return
    }

    try {
      console.log('✅ Aceitando chamada...')
      
      const stream = await getUserMedia(true, callState.callType === 'video')
      
      // Adicionar stream à conexão
      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream)
      })

      // Atualizar estado
      const newState: CallState = {
        ...callState,
        isCallActive: true,
        isConnecting: false,
        isIncomingCall: false,
        localStream: stream
      }
      
      setCallState(newState)
      onCallStateChanged(newState)

      // Mostrar stream local
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Criar resposta
      const answer = await peerConnection.current.createAnswer()
      await peerConnection.current.setLocalDescription(answer)
      
      console.log('📤 Resposta criada e enviada')
      onAnswerCreated(answer, callState.remoteUserId!)

    } catch (error) {
      console.error('❌ Erro ao aceitar chamada:', error)
      endCall()
    }
  }, [callState, getUserMedia, onAnswerCreated, onCallStateChanged])

  // Rejeitar chamada
  const rejectCall = useCallback(() => {
    console.log('❌ Chamada rejeitada')
    endCall()
  }, [])

  // Encerrar chamada
  const endCall = useCallback(() => {
    console.log('📞 Encerrando chamada...')
    
    // Parar streams
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop())
    }
    
    // Fechar conexão
    if (peerConnection.current) {
      peerConnection.current.close()
      peerConnection.current = null
    }

    // Limpar elementos de vídeo
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }

    // Resetar estado
    const newState: CallState = {
      isCallActive: false,
      isConnecting: false,
      isIncomingCall: false,
      isOutgoingCall: false,
      callType: null,
      remoteUserId: null,
      localStream: null,
      remoteStream: null
    }
    
    setCallState(newState)
    onCallStateChanged(newState)
    setConnectionState('new')
  }, [callState.localStream, onCallStateChanged])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (callState.localStream) {
      const audioTrack = callState.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
        console.log('🔇 Mute toggled:', !audioTrack.enabled)
      }
    }
  }, [callState.localStream])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (callState.localStream) {
      const videoTrack = callState.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
        console.log('📹 Video toggled:', videoTrack.enabled)
      }
    }
  }, [callState.localStream])

  // Métodos públicos para manipular ofertas/respostas/candidates externos
  const handleRemoteOffer = useCallback(async (offer: RTCSessionDescriptionInit, fromUserId: string, callType: 'audio' | 'video') => {
    console.log('📥 Oferta recebida de:', fromUserId)
    
    initializePeerConnection()
    
    await peerConnection.current!.setRemoteDescription(offer)
    
    // Atualizar estado para chamada recebida
    const newState: CallState = {
      isCallActive: false,
      isConnecting: false,
      isIncomingCall: true,
      isOutgoingCall: false,
      callType,
      remoteUserId: fromUserId,
      localStream: null,
      remoteStream: null
    }
    
    setCallState(newState)
    onCallStateChanged(newState)
  }, [initializePeerConnection, onCallStateChanged])

  const handleRemoteAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    console.log('📥 Resposta recebida')
    
    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(answer)
      
      // Atualizar estado para chamada ativa
      const newState: CallState = {
        ...callState,
        isCallActive: true,
        isConnecting: false,
        isOutgoingCall: false
      }
      
      setCallState(newState)
      onCallStateChanged(newState)
    }
  }, [callState, onCallStateChanged])

  const handleRemoteIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    console.log('📥 ICE candidate recebido:', candidate)
    
    if (peerConnection.current) {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall()
    }
  }, [])

  return {
    callState,
    localVideoRef,
    remoteVideoRef,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoEnabled,
    connectionState,
    // Métodos internos expostos para uso externo
    handleRemoteOffer,
    handleRemoteAnswer,
    handleRemoteIceCandidate
  } as WebRTCConnection & {
    handleRemoteOffer: (offer: RTCSessionDescriptionInit, fromUserId: string, callType: 'audio' | 'video') => Promise<void>
    handleRemoteAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>
    handleRemoteIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>
  }
}
