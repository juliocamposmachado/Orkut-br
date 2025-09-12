'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { 
  WebRTCSignaling, 
  WebRTCPeerConnection, 
  SignalingMessage,
  generateCallId,
  CallOffer
} from '@/lib/webrtc-signaling'

export interface AudioCallState {
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'
  callId: string | null
  remoteUserId: string | null
  isInitiator: boolean
  isMuted: boolean
  connectionState: RTCPeerConnectionState | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  error: string | null
}

export interface AudioCallControls {
  startCall: (targetUserId: string, callerInfo: any) => Promise<void>
  acceptCall: () => Promise<void>
  rejectCall: () => Promise<void>
  endCall: () => Promise<void>
  toggleMute: () => void
  getCallState: () => AudioCallState
}

export interface IncomingCall {
  callId: string
  fromUserId: string
  callerInfo: {
    id: string
    username: string
    display_name: string
    photo_url?: string
  }
  callType: 'audio' | 'video'
  sdp: RTCSessionDescriptionInit
}

export function useAudioCall(currentUserId: string) {
  // Estado da chamada
  const [callState, setCallState] = useState<AudioCallState>({
    status: 'idle',
    callId: null,
    remoteUserId: null,
    isInitiator: false,
    isMuted: false,
    connectionState: null,
    localStream: null,
    remoteStream: null,
    error: null
  })

  // Estado das chamadas recebidas
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)

  // Refs para objetos WebRTC
  const signalingRef = useRef<WebRTCSignaling | null>(null)
  const peerConnectionRef = useRef<WebRTCPeerConnection | null>(null)

  // Callback para chamada recebida
  const onIncomingCallCallback = useRef<((call: IncomingCall) => void) | null>(null)

  /**
   * Inicializa a conexão de sinalização
   */
  const initializeSignaling = useCallback(async () => {
    if (signalingRef.current || !currentUserId) return

    console.log('🎯 Inicializando sistema de chamadas para:', currentUserId)
    
    const signaling = new WebRTCSignaling(currentUserId)
    
    // Configurar callback para mensagens recebidas
    signaling.onMessage((message: SignalingMessage) => {
      console.log('📨 Mensagem de sinalização recebida:', message.type)
      handleSignalingMessage(message)
    })

    try {
      await signaling.connect()
      signalingRef.current = signaling
      console.log('✅ Sistema de sinalização conectado')
    } catch (error) {
      console.error('❌ Erro ao conectar sinalização:', error)
      setCallState(prev => ({ ...prev, error: 'Erro ao conectar sistema de chamadas' }))
    }
  }, [currentUserId])

  /**
   * Processa mensagens de sinalização recebidas
   */
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    const { type, callId, fromUserId, payload } = message

    switch (type) {
      case 'call-start':
        console.log('📞 Chamada recebida de:', fromUserId)
        const callOffer = payload as CallOffer
        
        // Notificar sobre chamada recebida
        const incoming: IncomingCall = {
          callId,
          fromUserId,
          callerInfo: callOffer.callerInfo,
          callType: callOffer.callType,
          sdp: callOffer.sdp
        }
        
        setIncomingCall(incoming)
        onIncomingCallCallback.current?.(incoming)
        
        setCallState(prev => ({
          ...prev,
          status: 'ringing',
          callId,
          remoteUserId: fromUserId,
          isInitiator: false
        }))
        break

      case 'offer':
        if (peerConnectionRef.current) {
          console.log('📨 Processando SDP offer')
          await peerConnectionRef.current.handleAnswer(payload.sdp)
        }
        break

      case 'answer':
        if (peerConnectionRef.current) {
          console.log('📨 Processando SDP answer')
          await peerConnectionRef.current.handleAnswer(payload.sdp)
        }
        break

      case 'ice-candidate':
        if (peerConnectionRef.current) {
          console.log('🧊 Processando ICE candidate')
          await peerConnectionRef.current.addICECandidate(payload.candidate)
        }
        break

      case 'call-reject':
        console.log('❌ Chamada rejeitada pelo usuário')
        setCallState(prev => ({
          ...prev,
          status: 'ended',
          error: 'Chamada rejeitada'
        }))
        cleanupCall()
        break

      case 'call-end':
        console.log('☎️ Chamada encerrada pelo usuário remoto')
        setCallState(prev => ({ ...prev, status: 'ended' }))
        cleanupCall()
        break
    }
  }, [])

  /**
   * Inicia uma chamada para outro usuário
   */
  const startCall = useCallback(async (targetUserId: string, callerInfo: any) => {
    if (!signalingRef.current) {
      throw new Error('Sistema de sinalização não inicializado')
    }

    const callId = generateCallId()
    console.log('📞 Iniciando chamada para:', targetUserId, 'ID:', callId)

    try {
      // Atualizar estado
      setCallState(prev => ({
        ...prev,
        status: 'calling',
        callId,
        remoteUserId: targetUserId,
        isInitiator: true,
        error: null
      }))

      // Criar conexão WebRTC
      const peerConnection = new WebRTCPeerConnection(
        signalingRef.current,
        callId,
        targetUserId,
        true // isInitiator
      )

      // Configurar callbacks
      peerConnection.onRemoteStream((stream) => {
        console.log('📡 Stream remoto conectado')
        setCallState(prev => ({ 
          ...prev, 
          remoteStream: stream,
          status: 'connected' 
        }))
      })

      peerConnection.onConnectionStateChange((state) => {
        console.log('🔄 Estado da conexão:', state)
        setCallState(prev => ({ ...prev, connectionState: state }))
        
        if (state === 'connected') {
          setCallState(prev => ({ ...prev, status: 'connected' }))
        } else if (state === 'failed' || state === 'disconnected') {
          setCallState(prev => ({ 
            ...prev, 
            status: 'ended',
            error: 'Conexão perdida'
          }))
        }
      })

      peerConnectionRef.current = peerConnection

      // Iniciar chamada e obter offer
      const offer = await peerConnection.startCall()
      
      // Atualizar stream local
      setCallState(prev => ({ 
        ...prev, 
        localStream: peerConnection.getLocalStream() 
      }))

      // Enviar oferta via Supabase Realtime
      const callOffer: CallOffer = {
        sdp: offer,
        callType: 'audio',
        callerInfo
      }

      await signalingRef.current.sendCallOffer(targetUserId, callId, callOffer)
      console.log('✅ Oferta de chamada enviada')

    } catch (error) {
      console.error('❌ Erro ao iniciar chamada:', error)
      setCallState(prev => ({
        ...prev,
        status: 'ended',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }))
      cleanupCall()
      throw error
    }
  }, [])

  /**
   * Aceita uma chamada recebida
   */
  const acceptCall = useCallback(async () => {
    if (!signalingRef.current || !incomingCall) {
      throw new Error('Nenhuma chamada para aceitar')
    }

    const { callId, fromUserId, callerInfo } = incomingCall

    try {
      console.log('✅ Aceitando chamada:', callId)

      // Criar conexão WebRTC
      const peerConnection = new WebRTCPeerConnection(
        signalingRef.current,
        callId,
        fromUserId,
        false // não é iniciador
      )

      // Configurar callbacks
      peerConnection.onRemoteStream((stream) => {
        console.log('📡 Stream remoto conectado')
        setCallState(prev => ({ 
          ...prev, 
          remoteStream: stream,
          status: 'connected' 
        }))
      })

      peerConnection.onConnectionStateChange((state) => {
        console.log('🔄 Estado da conexão:', state)
        setCallState(prev => ({ ...prev, connectionState: state }))
      })

      peerConnectionRef.current = peerConnection

      // Aceitar chamada com o offer recebido
      const answer = await peerConnection.acceptCall(incomingCall.sdp)
      
      // Atualizar stream local
      setCallState(prev => ({ 
        ...prev, 
        localStream: peerConnection.getLocalStream(),
        status: 'connected'
      }))

      // Enviar resposta
      await signalingRef.current.sendAnswer(fromUserId, callId, answer)
      
      // Limpar chamada recebida
      setIncomingCall(null)
      
      console.log('✅ Chamada aceita e resposta enviada')

    } catch (error) {
      console.error('❌ Erro ao aceitar chamada:', error)
      setCallState(prev => ({
        ...prev,
        status: 'ended',
        error: error instanceof Error ? error.message : 'Erro ao aceitar chamada'
      }))
      cleanupCall()
      throw error
    }
  }, [incomingCall])

  /**
   * Rejeita uma chamada recebida
   */
  const rejectCall = useCallback(async () => {
    if (!signalingRef.current || !incomingCall) return

    const { callId, fromUserId } = incomingCall

    try {
      console.log('❌ Rejeitando chamada:', callId)
      await signalingRef.current.sendCallReject(fromUserId, callId)
      
      setIncomingCall(null)
      setCallState(prev => ({ ...prev, status: 'idle' }))
      
    } catch (error) {
      console.error('Erro ao rejeitar chamada:', error)
    }
  }, [incomingCall])

  /**
   * Encerra a chamada atual
   */
  const endCall = useCallback(async () => {
    if (!signalingRef.current || !callState.callId || !callState.remoteUserId) return

    try {
      console.log('☎️ Encerrando chamada:', callState.callId)
      await signalingRef.current.sendCallEnd(callState.remoteUserId, callState.callId)
      
      setCallState(prev => ({ ...prev, status: 'ended' }))
      cleanupCall()
      
    } catch (error) {
      console.error('Erro ao encerrar chamada:', error)
    }
  }, [callState.callId, callState.remoteUserId])

  /**
   * Silencia/desilencia o microfone
   */
  const toggleMute = useCallback(() => {
    if (!peerConnectionRef.current) return

    const isMuted = peerConnectionRef.current.toggleMicrophone()
    setCallState(prev => ({ ...prev, isMuted: !isMuted }))
  }, [])

  /**
   * Limpa recursos da chamada
   */
  const cleanupCall = useCallback(() => {
    console.log('🧹 Limpando recursos da chamada')
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    setCallState(prev => ({
      ...prev,
      callId: null,
      remoteUserId: null,
      localStream: null,
      remoteStream: null,
      connectionState: null,
      isMuted: false
    }))
  }, [])

  /**
   * Define callback para chamadas recebidas
   */
  const onIncomingCall = useCallback((callback: (call: IncomingCall) => void) => {
    onIncomingCallCallback.current = callback
  }, [])

  // Inicializar ao montar o componente
  useEffect(() => {
    initializeSignaling()

    return () => {
      // Cleanup ao desmontar
      if (signalingRef.current) {
        signalingRef.current.disconnect()
        signalingRef.current = null
      }
      cleanupCall()
    }
  }, [initializeSignaling, cleanupCall])

  // Retornar interface pública
  const controls: AudioCallControls = {
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    getCallState: () => callState
  }

  return {
    ...controls,
    callState,
    incomingCall,
    onIncomingCall
  }
}
