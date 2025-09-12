import { useCallback, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useWebRTC, CallState } from './useWebRTC'
import { useCallSignaling } from './useCallSignaling'

interface UserInfo {
  id: string
  name: string
  photo_url?: string
}

interface CallSystemState extends CallState {
  remoteUserInfo?: UserInfo
  signallingConnected: boolean
  error?: string
}

export interface CallSystemHook {
  callState: CallSystemState
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

export const useCallSystem = (currentUserId: string | null): CallSystemHook => {
  const [callSystemState, setCallSystemState] = useState<CallSystemState>({
    isCallActive: false,
    isConnecting: false,
    isIncomingCall: false,
    isOutgoingCall: false,
    callType: null,
    remoteUserId: null,
    localStream: null,
    remoteStream: null,
    signallingConnected: false
  })

  // Estados para notificações de chamada
  const [incomingCallNotification, setIncomingCallNotification] = useState<{
    show: boolean
    fromUserId: string
    callType: 'audio' | 'video'
    userInfo?: UserInfo
  } | null>(null)

  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Buscar informações do usuário
  const getUserInfo = useCallback(async (userId: string): Promise<UserInfo | null> => {
    if (!supabase) return null

    try {
      // Verificar se é usuário de teste
      if (userId.startsWith('user_')) {
        const testUsers = {
          'user_1': { id: 'user_1', name: 'Ana Silva', photo_url: 'https://i.pravatar.cc/150?img=1' },
          'user_2': { id: 'user_2', name: 'Carlos Santos', photo_url: 'https://i.pravatar.cc/150?img=2' },
          'user_3': { id: 'user_3', name: 'Marina Costa', photo_url: 'https://i.pravatar.cc/150?img=3' }
        }
        return testUsers[userId as keyof typeof testUsers] || null
      }

      // Buscar no banco de dados
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, photo_url')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erro ao buscar informações do usuário:', error)
        return null
      }

      return {
        id: data.id,
        name: data.display_name || 'Usuário',
        photo_url: data.photo_url
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      return null
    }
  }, [supabase])

  // Callbacks para WebRTC
  const handleOfferCreated = useCallback((offer: RTCSessionDescriptionInit, targetUserId: string, callType: 'audio' | 'video') => {
    if (signaling.isConnected) {
      signaling.sendCallOffer(targetUserId, offer, callType)
    }
  }, [])

  const handleAnswerCreated = useCallback((answer: RTCSessionDescriptionInit, targetUserId: string) => {
    if (signaling.isConnected) {
      signaling.sendCallAnswer(targetUserId, answer)
    }
  }, [])

  const handleIceCandidateGenerated = useCallback((candidate: RTCIceCandidateInit, targetUserId: string) => {
    if (signaling.isConnected) {
      signaling.sendIceCandidate(targetUserId, candidate)
    }
  }, [])

  const handleCallStateChanged = useCallback(async (state: CallState) => {
    let userInfo: UserInfo | undefined

    if (state.remoteUserId) {
      const info = await getUserInfo(state.remoteUserId)
      if (info) {
        userInfo = info
      }
    }

    setCallSystemState(prev => ({
      ...prev,
      ...state,
      remoteUserInfo: userInfo
    }))

    // Limpar notificação se chamada foi aceita/rejeitada
    if (state.isCallActive || (!state.isIncomingCall && !state.isOutgoingCall && !state.isConnecting)) {
      setIncomingCallNotification(null)
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }
    }
  }, [getUserInfo])

  // Inicializar WebRTC
  const webrtc = useWebRTC(
    handleOfferCreated,
    handleAnswerCreated,
    handleIceCandidateGenerated,
    handleCallStateChanged
  ) as any

  // Callbacks para sinalização
  const handleCallOffer = useCallback(async (offer: RTCSessionDescriptionInit, fromUserId: string, callType: 'audio' | 'video') => {
    console.log('📞 Oferta de chamada recebida:', { fromUserId, callType })

    // Buscar informações do usuário
    const userInfo = await getUserInfo(fromUserId)

    // Mostrar notificação de chamada recebida
    setIncomingCallNotification({
      show: true,
      fromUserId,
      callType,
      userInfo: userInfo || undefined
    })

    // Timeout automático para chamadas não atendidas (30 segundos)
    notificationTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Timeout de chamada recebida')
      setIncomingCallNotification(null)
      if (signaling.isConnected) {
        signaling.sendCallReject(fromUserId)
      }
    }, 30000)

    // Processar oferta no WebRTC
    await webrtc.handleRemoteOffer(offer, fromUserId, callType)
  }, [getUserInfo, webrtc])

  const handleCallAnswer = useCallback(async (answer: RTCSessionDescriptionInit, fromUserId: string) => {
    console.log('✅ Resposta de chamada recebida de:', fromUserId)
    await webrtc.handleRemoteAnswer(answer)
  }, [webrtc])

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit, fromUserId: string) => {
    console.log('🧊 ICE candidate recebido de:', fromUserId)
    await webrtc.handleRemoteIceCandidate(candidate)
  }, [webrtc])

  const handleCallEnd = useCallback((fromUserId: string) => {
    console.log('📞 Chamada encerrada por:', fromUserId)
    webrtc.endCall()
    setIncomingCallNotification(null)
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current)
    }
  }, [webrtc])

  const handleCallReject = useCallback((fromUserId: string) => {
    console.log('❌ Chamada rejeitada por:', fromUserId)
    webrtc.endCall()
    setIncomingCallNotification(null)
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current)
    }
  }, [webrtc])

  // Inicializar sinalização
  const signaling = useCallSignaling(
    currentUserId || '',
    handleCallOffer,
    handleCallAnswer,
    handleIceCandidate,
    handleCallEnd,
    handleCallReject
  )

  // Atualizar estado da sinalização
  useEffect(() => {
    setCallSystemState(prev => ({
      ...prev,
      signallingConnected: signaling.isConnected
    }))
  }, [signaling.isConnected])

  // Métodos públicos do sistema
  const initiateCall = useCallback(async (userId: string, type: 'audio' | 'video') => {
    if (!currentUserId) {
      throw new Error('Usuário não autenticado')
    }

    if (!signaling.isConnected) {
      throw new Error('Sistema de sinalização não conectado')
    }

    console.log(`📞 Iniciando chamada ${type} para ${userId}`)
    
    try {
      await webrtc.initiateCall(userId, type)
    } catch (error) {
      console.error('Erro ao iniciar chamada:', error)
      setCallSystemState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao iniciar chamada'
      }))
      throw error
    }
  }, [currentUserId, signaling.isConnected, webrtc])

  const acceptCall = useCallback(async () => {
    if (incomingCallNotification) {
      console.log('✅ Aceitando chamada de:', incomingCallNotification.fromUserId)
      
      // Limpar timeout e notificação
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }
      setIncomingCallNotification(null)
      
      try {
        await webrtc.acceptCall()
      } catch (error) {
        console.error('Erro ao aceitar chamada:', error)
        setCallSystemState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Erro ao aceitar chamada'
        }))
      }
    }
  }, [incomingCallNotification, webrtc])

  const rejectCall = useCallback(() => {
    if (incomingCallNotification) {
      console.log('❌ Rejeitando chamada de:', incomingCallNotification.fromUserId)
      
      // Enviar rejeição
      if (signaling.isConnected) {
        signaling.sendCallReject(incomingCallNotification.fromUserId)
      }
      
      // Limpar timeout e notificação
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }
      setIncomingCallNotification(null)
      
      webrtc.rejectCall()
    } else {
      webrtc.rejectCall()
    }
  }, [incomingCallNotification, signaling, webrtc])

  const endCall = useCallback(() => {
    console.log('📞 Encerrando chamada...')
    
    // Notificar o outro usuário
    if (callSystemState.remoteUserId && signaling.isConnected) {
      signaling.sendCallEnd(callSystemState.remoteUserId)
    }
    
    // Limpar notificações
    setIncomingCallNotification(null)
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current)
    }
    
    webrtc.endCall()
  }, [callSystemState.remoteUserId, signaling, webrtc])

  // Cleanup
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }
    }
  }, [])

  return {
    callState: callSystemState,
    localVideoRef: webrtc.localVideoRef,
    remoteVideoRef: webrtc.remoteVideoRef,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute: webrtc.toggleMute,
    toggleVideo: webrtc.toggleVideo,
    isMuted: webrtc.isMuted,
    isVideoEnabled: webrtc.isVideoEnabled,
    connectionState: webrtc.connectionState
  }
}
