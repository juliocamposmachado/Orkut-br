"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CallState, RTCSignalPayload } from '@/lib/types/webrtc'

interface UseWebRTCCallOptions {
  roomId: string
  currentUserId: string
  targetUserId: string
  onCallStateChange?: (state: CallState) => void
  onError?: (error: Error) => void
}

export function useWebRTCCall({
  roomId,
  currentUserId, 
  targetUserId,
  onCallStateChange,
  onError
}: UseWebRTCCallOptions) {
  // Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<any>(null)
  
  // Estado
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    localStream: null,
    remoteStream: null,
    currentCallId: null,
    isMuted: false,
    isCallActive: false
  })

  // Configuração WebRTC
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  // 🔹 Atualizar estado com callback
  const updateCallState = useCallback((newState: Partial<CallState>) => {
    setCallState(prev => {
      const updated = { ...prev, ...newState }
      onCallStateChange?.(updated)
      return updated
    })
  }, [onCallStateChange])

  // 🔹 Inicializar PeerConnection
  const initializePeerConnection = useCallback(async (): Promise<RTCPeerConnection> => {
    const pc = new RTCPeerConnection(rtcConfig)

    // Receber stream remoto
    pc.ontrack = (event) => {
      console.log('🎵 Stream remoto recebido')
      updateCallState({ remoteStream: event.streams[0] })
    }

    // ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate && channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            callId: roomId,
            from: currentUserId,
            to: targetUserId,
            data: event.candidate,
            timestamp: Date.now()
          } as RTCSignalPayload
        })
      }
    }

    // Estado da conexão
    pc.onconnectionstatechange = () => {
      console.log('🔗 Estado da conexão:', pc.connectionState)
      if (pc.connectionState === 'connected') {
        updateCallState({ status: 'connected', isCallActive: true })
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall()
      }
    }

    peerConnectionRef.current = pc
    return pc
  }, [roomId, currentUserId, targetUserId, updateCallState])

  // 🔹 Capturar áudio local
  const getLocalStream = useCallback(async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      })

      updateCallState({ localStream: stream })
      return stream
    } catch (error) {
      console.error('❌ Erro ao capturar áudio:', error)
      onError?.(error as Error)
      throw error
    }
  }, [updateCallState, onError])

  // 🔹 Iniciar chamada
  const startCall = useCallback(async () => {
    try {
      console.log('📞 Iniciando chamada...')
      updateCallState({ status: 'calling', currentCallId: roomId })

      const pc = await initializePeerConnection()
      const stream = await getLocalStream()

      // Adicionar tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // Criar oferta
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Enviar oferta
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'call-offer',
          payload: {
            callId: roomId,
            from: currentUserId,
            to: targetUserId,
            data: offer,
            timestamp: Date.now()
          } as RTCSignalPayload
        })
      }

    } catch (error) {
      console.error('❌ Erro ao iniciar chamada:', error)
      onError?.(error as Error)
      updateCallState({ status: 'idle' })
    }
  }, [roomId, currentUserId, targetUserId, initializePeerConnection, getLocalStream, updateCallState, onError])

  // 🔹 Responder chamada
  const answerCall = useCallback(async (offer: RTCSessionDescriptionInit) => {
    try {
      console.log('📱 Respondendo chamada...')
      updateCallState({ status: 'ringing' })

      const pc = await initializePeerConnection()
      const stream = await getLocalStream()

      // Adicionar tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // Configurar descrição remota
      await pc.setRemoteDescription(new RTCSessionDescription(offer))

      // Criar resposta
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // Enviar resposta
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'call-answer',
          payload: {
            callId: roomId,
            from: currentUserId,
            to: targetUserId,
            data: answer,
            timestamp: Date.now()
          } as RTCSignalPayload
        })
      }

      updateCallState({ status: 'connected', isCallActive: true })

    } catch (error) {
      console.error('❌ Erro ao responder chamada:', error)
      onError?.(error as Error)
      endCall()
    }
  }, [roomId, currentUserId, targetUserId, initializePeerConnection, getLocalStream, updateCallState, onError])

  // 🔹 Aceitar chamada
  const acceptCall = useCallback(() => {
    updateCallState({ status: 'connected', isCallActive: true })
  }, [updateCallState])

  // 🔹 Rejeitar chamada
  const rejectCall = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'call-reject',
        payload: {
          callId: roomId,
          from: currentUserId,
          to: targetUserId,
          timestamp: Date.now()
        }
      })
    }
    endCall()
  }, [roomId, currentUserId, targetUserId])

  // 🔹 Encerrar chamada
  const endCall = useCallback(async () => {
    console.log('📴 Encerrando chamada...')

    // Parar streams
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop())
    }

    // Fechar PeerConnection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Notificar término
    if (channelRef.current && callState.isCallActive) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'call-end',
        payload: {
          callId: roomId,
          from: currentUserId,
          to: targetUserId,
          timestamp: Date.now()
        }
      })
    }

    updateCallState({
      status: 'idle',
      localStream: null,
      remoteStream: null,
      currentCallId: null,
      isMuted: false,
      isCallActive: false
    })
  }, [callState, roomId, currentUserId, targetUserId, updateCallState])

  // 🔹 Toggle mute
  const toggleMute = useCallback(() => {
    if (callState.localStream) {
      const audioTrack = callState.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = callState.isMuted
        updateCallState({ isMuted: !callState.isMuted })
      }
    }
  }, [callState.localStream, callState.isMuted, updateCallState])

  // 🔹 Configurar Supabase Realtime
  useEffect(() => {
    const channel = supabase.channel(`audio-call-${roomId}`)
    channelRef.current = channel

    // Listeners de eventos
    channel.on('broadcast', { event: 'call-offer' }, async ({ payload }: { payload: RTCSignalPayload }) => {
      if (payload.to === currentUserId) {
        await answerCall(payload.data)
      }
    })

    channel.on('broadcast', { event: 'call-answer' }, async ({ payload }: { payload: RTCSignalPayload }) => {
      if (payload.to === currentUserId && peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.data))
        updateCallState({ status: 'connected', isCallActive: true })
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
        endCall()
      }
    })

    channel.on('broadcast', { event: 'call-reject' }, ({ payload }: { payload: RTCSignalPayload }) => {
      if (payload.to === currentUserId) {
        endCall()
      }
    })

    channel.subscribe()

    return () => {
      channel.unsubscribe()
      endCall()
    }
  }, [roomId, currentUserId, answerCall, updateCallState, endCall])

  return {
    callState,
    startCall,
    answerCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    // Estados auxiliares
    isIdle: callState.status === 'idle',
    isCalling: callState.status === 'calling',
    isRinging: callState.status === 'ringing',
    isConnected: callState.status === 'connected',
    isActive: callState.isCallActive
  }
}
