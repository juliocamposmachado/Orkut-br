"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CallState, RTCSignalPayload } from '@/lib/types/webrtc'
import { toast } from 'sonner'

// Tipos do contexto
interface CallUser {
  id: string
  name: string
  photo?: string
  username?: string
}

interface CallContextValue {
  // Estado atual da chamada
  currentCall: CallState | null
  isInCall: boolean
  
  // Métodos de controle
  startAudioCall: (targetUser: CallUser) => Promise<void>
  startVideoCall: (targetUser: CallUser) => Promise<void>
  acceptCall: () => void
  rejectCall: () => void
  endCall: () => void
  toggleMute: () => void
  
  // Informações da chamada
  targetUser: CallUser | null
  callType: 'audio' | 'video' | null
  roomId: string | null
  
  // Estados auxiliares
  isConnecting: boolean
  hasIncomingCall: boolean
  error: string | null
}

const CallContext = createContext<CallContextValue | null>(null)

// Hook para usar o contexto
export const useCall = () => {
  const context = useContext(CallContext)
  if (!context) {
    throw new Error('useCall deve ser usado dentro de um CallProvider')
  }
  return context
}

interface CallProviderProps {
  children: React.ReactNode
  currentUserId: string
}

export const CallProvider: React.FC<CallProviderProps> = ({ 
  children, 
  currentUserId 
}) => {
  // Estados
  const [currentCall, setCurrentCall] = useState<CallState | null>(null)
  const [targetUser, setTargetUser] = useState<CallUser | null>(null)
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [hasIncomingCall, setHasIncomingCall] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs para WebRTC
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const channelRef = useRef<any>(null)

  // Estados derivados
  const isInCall = currentCall?.isCallActive || false

  // Configuração WebRTC
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  // 🔹 Gerar ID único para sala
  const generateRoomId = (userId1: string, userId2: string): string => {
    const sortedIds = [userId1, userId2].sort()
    return `call_${sortedIds[0]}_${sortedIds[1]}_${Date.now()}`
  }

  // 🔹 Inicializar PeerConnection
  const initializePeerConnection = async (): Promise<RTCPeerConnection> => {
    const pc = new RTCPeerConnection(rtcConfig)

    pc.ontrack = (event) => {
      console.log('📺 Stream remoto recebido')
      if (currentCall) {
        setCurrentCall(prev => prev ? { ...prev, remoteStream: event.streams[0] } : null)
      }
    }

    pc.onicecandidate = async (event) => {
      if (event.candidate && channelRef.current && roomId && targetUser) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            callId: roomId,
            from: currentUserId,
            to: targetUser.id,
            data: event.candidate,
            timestamp: Date.now()
          } as RTCSignalPayload
        })
      }
    }

    pc.onconnectionstatechange = () => {
      console.log('🔗 Estado da conexão:', pc.connectionState)
      if (pc.connectionState === 'connected') {
        setCurrentCall(prev => prev ? { ...prev, status: 'connected', isCallActive: true } : null)
        setIsConnecting(false)
        toast.success('Conectado!')
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        handleCallEnd()
      }
    }

    peerConnectionRef.current = pc
    return pc
  }

  // 🔹 Capturar mídia local
  const getLocalStream = async (video: boolean = false): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false
      })

      localStreamRef.current = stream
      setCurrentCall(prev => prev ? { ...prev, localStream: stream } : null)
      return stream
    } catch (error) {
      console.error('❌ Erro ao capturar mídia:', error)
      setError('Erro ao acessar microfone/câmera')
      throw error
    }
  }

  // 🔹 Iniciar chamada
  const startCall = async (user: CallUser, type: 'audio' | 'video') => {
    try {
      setError(null)
      setIsConnecting(true)
      setTargetUser(user)
      setCallType(type)

      const newRoomId = generateRoomId(currentUserId, user.id)
      setRoomId(newRoomId)

      // Inicializar WebRTC
      const pc = await initializePeerConnection()
      const stream = await getLocalStream(type === 'video')

      // Adicionar tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // Configurar estado da chamada
      setCurrentCall({
        status: 'calling',
        localStream: stream,
        remoteStream: null,
        currentCallId: newRoomId,
        isMuted: false,
        isCallActive: false
      })

      // Criar e enviar oferta
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Conectar ao canal Supabase
      const channel = supabase.channel(`audio-call-${newRoomId}`)
      channelRef.current = channel
      await channel.subscribe()

      await channel.send({
        type: 'broadcast',
        event: 'call-offer',
        payload: {
          callId: newRoomId,
          from: currentUserId,
          to: user.id,
          data: offer,
          timestamp: Date.now()
        } as RTCSignalPayload
      })

      toast.info(`Chamando ${user.name}...`)

    } catch (error) {
      console.error('❌ Erro ao iniciar chamada:', error)
      setError('Erro ao iniciar chamada')
      handleCallEnd()
    }
  }

  // 🔹 Iniciar chamada de áudio
  const startAudioCall = async (user: CallUser) => {
    await startCall(user, 'audio')
  }

  // 🔹 Iniciar chamada de vídeo  
  const startVideoCall = async (user: CallUser) => {
    await startCall(user, 'video')
  }

  // 🔹 Responder chamada recebida
  const answerCall = async (offer: RTCSessionDescriptionInit) => {
    try {
      if (!targetUser || !roomId) return

      setIsConnecting(true)
      const pc = await initializePeerConnection()
      const stream = await getLocalStream(callType === 'video')

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      await pc.setRemoteDescription(new RTCSessionDescription(offer))

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'call-answer',
          payload: {
            callId: roomId,
            from: currentUserId,
            to: targetUser.id,
            data: answer,
            timestamp: Date.now()
          } as RTCSignalPayload
        })
      }

      setCurrentCall(prev => prev ? { ...prev, status: 'connected', isCallActive: true } : null)
      setHasIncomingCall(false)

    } catch (error) {
      console.error('❌ Erro ao responder chamada:', error)
      setError('Erro ao aceitar chamada')
      handleCallEnd()
    }
  }

  // 🔹 Aceitar chamada
  const acceptCall = () => {
    setHasIncomingCall(false)
    // A lógica de aceitar já está no answerCall
  }

  // 🔹 Rejeitar chamada
  const rejectCall = async () => {
    if (channelRef.current && roomId && targetUser) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'call-reject',
        payload: {
          callId: roomId,
          from: currentUserId,
          to: targetUser.id,
          timestamp: Date.now()
        }
      })
    }
    
    toast.info('Chamada rejeitada')
    handleCallEnd()
  }

  // 🔹 Encerrar chamada
  const handleCallEnd = async () => {
    console.log('📴 Encerrando chamada...')

    // Parar streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    // Fechar PeerConnection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Notificar fim da chamada
    if (channelRef.current && roomId && targetUser && currentCall?.isCallActive) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'call-end',
        payload: {
          callId: roomId,
          from: currentUserId,
          to: targetUser.id,
          timestamp: Date.now()
        }
      })
    }

    // Limpar canal
    if (channelRef.current) {
      await channelRef.current.unsubscribe()
      channelRef.current = null
    }

    // Limpar estados
    setCurrentCall(null)
    setTargetUser(null)
    setCallType(null)
    setRoomId(null)
    setIsConnecting(false)
    setHasIncomingCall(false)
    setError(null)
  }

  const endCall = () => {
    handleCallEnd()
    toast.info('Chamada encerrada')
  }

  // 🔹 Toggle mute
  const toggleMute = () => {
    if (currentCall?.localStream) {
      const audioTrack = currentCall.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = currentCall.isMuted
        setCurrentCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null)
        toast.info(currentCall.isMuted ? 'Microfone ativado' : 'Microfone silenciado')
      }
    }
  }

  // 🔹 Configurar listeners Supabase Realtime
  useEffect(() => {
    if (!currentUserId) return

    // Canal global para receber chamadas
    const globalChannel = supabase.channel(`user-calls-${currentUserId}`)

    globalChannel.on('broadcast', { event: 'call-offer' }, async ({ payload }: { payload: RTCSignalPayload }) => {
      if (payload.to === currentUserId && !isInCall) {
        // Chamada recebida
        console.log('📞 Chamada recebida de:', payload.from)
        
        setHasIncomingCall(true)
        setRoomId(payload.callId)
        setCallType('audio') // Assumir áudio por padrão
        setTargetUser({ id: payload.from, name: payload.from }) // Idealmente buscar dados do usuário
        
        setCurrentCall({
          status: 'ringing',
          localStream: null,
          remoteStream: null,
          currentCallId: payload.callId,
          isMuted: false,
          isCallActive: false
        })

        // Conectar ao canal da chamada
        const callChannel = supabase.channel(`audio-call-${payload.callId}`)
        channelRef.current = callChannel
        await callChannel.subscribe()
        
        // Guardar oferta para quando aceitar
        setTimeout(() => answerCall(payload.data), 100)
        
        toast.info('Chamada recebida!', {
          duration: 30000,
          action: {
            label: 'Aceitar',
            onClick: acceptCall,
          },
        })
      }
    })

    globalChannel.subscribe()

    return () => {
      globalChannel.unsubscribe()
    }
  }, [currentUserId, isInCall])

  // 🔹 Configurar listeners do canal da chamada ativa
  useEffect(() => {
    if (!roomId || !channelRef.current) return

    const channel = channelRef.current

    channel.on('broadcast', { event: 'call-answer' }, async ({ payload }: { payload: RTCSignalPayload }) => {
      if (payload.to === currentUserId && peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.data))
        setCurrentCall(prev => prev ? { ...prev, status: 'connected', isCallActive: true } : null)
        setIsConnecting(false)
      }
    })

    channel.on('broadcast', { event: 'ice-candidate' }, async ({ payload }: { payload: RTCSignalPayload }) => {
      if (payload.to === currentUserId && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.data))
        } catch (error) {
          console.error('❌ Erro ao adicionar ICE candidate:', error)
        }
      }
    })

    channel.on('broadcast', { event: 'call-end' }, ({ payload }: { payload: RTCSignalPayload }) => {
      if (payload.to === currentUserId) {
        toast.info('Chamada encerrada')
        handleCallEnd()
      }
    })

    channel.on('broadcast', { event: 'call-reject' }, ({ payload }: { payload: RTCSignalPayload }) => {
      if (payload.to === currentUserId) {
        toast.info('Chamada rejeitada')
        handleCallEnd()
      }
    })

    return () => {
      // Cleanup será feito no handleCallEnd
    }
  }, [roomId, currentUserId])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      handleCallEnd()
    }
  }, [])

  const value: CallContextValue = {
    currentCall,
    isInCall,
    startAudioCall,
    startVideoCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    targetUser,
    callType,
    roomId,
    isConnecting,
    hasIncomingCall,
    error
  }

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  )
}
