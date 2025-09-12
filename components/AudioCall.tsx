"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { WebRTCSignal, CallState, WebRTCConfig, RTCSignalPayload } from '@/lib/types/webrtc'
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'

interface AudioCallProps {
  roomId: string
  currentUserId: string
  targetUserId: string
  onCallEnd?: () => void
}

export default function AudioCall({ 
  roomId, 
  currentUserId, 
  targetUserId, 
  onCallEnd 
}: AudioCallProps) {
  // Refs para elementos de áudio
  const localAudioRef = useRef<HTMLAudioElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<any>(null)

  // Estado da chamada
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    localStream: null,
    remoteStream: null,
    currentCallId: null,
    isMuted: false,
    isCallActive: false
  })

  // Configuração WebRTC
  const rtcConfig: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    enableAudio: true,
    enableVideo: false
  }

  // 🔹 Inicializar conexão WebRTC
  const initializePeerConnection = useCallback(async (): Promise<RTCPeerConnection> => {
    const pc = new RTCPeerConnection({
      iceServers: rtcConfig.iceServers
    })

    // Event: Receber stream remoto
    pc.ontrack = (event) => {
      console.log('📺 Stream remoto recebido:', event.streams[0])
      const remoteStream = event.streams[0]
      
      setCallState(prev => ({ ...prev, remoteStream }))
      
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream
      }
    }

    // Event: ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate && channelRef.current) {
        console.log('🧊 Enviando ICE candidate')
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

    // Event: Estado da conexão
    pc.onconnectionstatechange = () => {
      console.log('🔗 Estado da conexão:', pc.connectionState)
      if (pc.connectionState === 'connected') {
        setCallState(prev => ({ ...prev, status: 'connected' }))
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        handleCallEnd()
      }
    }

    peerConnectionRef.current = pc
    return pc
  }, [roomId, currentUserId, targetUserId])

  // 🔹 Capturar áudio local
  const initializeLocalStream = useCallback(async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      })

      console.log('🎤 Stream local capturado')
      setCallState(prev => ({ ...prev, localStream: stream }))

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream
      }

      return stream
    } catch (error) {
      console.error('❌ Erro ao capturar áudio:', error)
      throw error
    }
  }, [])

  // 🔹 Criar oferta (SDP Offer)
  const createOffer = useCallback(async () => {
    try {
      console.log('📞 Iniciando chamada...')
      setCallState(prev => ({ ...prev, status: 'calling', currentCallId: roomId }))

      const pc = await initializePeerConnection()
      const stream = await initializeLocalStream()

      // Adicionar tracks locais
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Criar oferta
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Enviar oferta via Supabase Realtime
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
      console.error('❌ Erro ao criar oferta:', error)
      setCallState(prev => ({ ...prev, status: 'idle' }))
    }
  }, [roomId, currentUserId, targetUserId, initializePeerConnection, initializeLocalStream])

  // 🔹 Criar resposta (SDP Answer)
  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    try {
      console.log('📱 Recebendo chamada...')
      setCallState(prev => ({ 
        ...prev, 
        status: 'ringing', 
        currentCallId: roomId 
      }))

      const pc = await initializePeerConnection()
      const stream = await initializeLocalStream()

      // Adicionar tracks locais
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Configurar descrição remota
      await pc.setRemoteDescription(new RTCSessionDescription(offer))

      // Criar resposta
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // Enviar resposta via Supabase Realtime
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

      setCallState(prev => ({ ...prev, status: 'connected', isCallActive: true }))

    } catch (error) {
      console.error('❌ Erro ao criar resposta:', error)
      handleCallEnd()
    }
  }, [roomId, currentUserId, targetUserId, initializePeerConnection, initializeLocalStream])

  // 🔹 Aceitar chamada
  const acceptCall = useCallback(() => {
    setCallState(prev => ({ ...prev, status: 'connected', isCallActive: true }))
  }, [])

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
    handleCallEnd()
  }, [roomId, currentUserId, targetUserId])

  // 🔹 Encerrar chamada
  const handleCallEnd = useCallback(async () => {
    console.log('📴 Encerrando chamada...')

    // Parar tracks de mídia
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop())
    }

    // Fechar conexão
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Notificar fim da chamada
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

    setCallState({
      status: 'idle',
      localStream: null,
      remoteStream: null,
      currentCallId: null,
      isMuted: false,
      isCallActive: false
    })

    onCallEnd?.()
  }, [callState, roomId, currentUserId, targetUserId, onCallEnd])

  // 🔹 Toggle mute
  const toggleMute = useCallback(() => {
    if (callState.localStream) {
      const audioTrack = callState.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = callState.isMuted
        setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }))
      }
    }
  }, [callState.localStream, callState.isMuted])

  // 🔹 Configurar Supabase Realtime
  useEffect(() => {
    const channel = supabase.channel(`audio-call-${roomId}`)
    channelRef.current = channel

    // Event listeners
    channel.on('broadcast', { event: 'call-offer' }, async ({ payload }: { payload: RTCSignalPayload }) => {
      if (payload.to === currentUserId) {
        await createAnswer(payload.data)
      }
    })

    channel.on('broadcast', { event: 'call-answer' }, async ({ payload }: { payload: RTCSignalPayload }) => {
      if (payload.to === currentUserId && peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.data))
        setCallState(prev => ({ ...prev, status: 'connected', isCallActive: true }))
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
        handleCallEnd()
      }
    })

    channel.on('broadcast', { event: 'call-reject' }, ({ payload }: { payload: RTCSignalPayload }) => {
      if (payload.to === currentUserId) {
        handleCallEnd()
      }
    })

    channel.subscribe()

    return () => {
      channel.unsubscribe()
      handleCallEnd()
    }
  }, [roomId, currentUserId, createAnswer, handleCallEnd])

  // 🎨 Renderização da UI
  return (
    <div className="audio-call-container p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {callState.status === 'idle' && 'Pronto para ligar'}
          {callState.status === 'calling' && 'Chamando...'}
          {callState.status === 'ringing' && 'Chamada recebida'}
          {callState.status === 'connected' && 'Em chamada'}
          {callState.status === 'ended' && 'Chamada encerrada'}
        </h2>
        <p className="text-sm text-gray-600">
          {targetUserId}
        </p>
      </div>

      {/* Controles da chamada */}
      <div className="flex justify-center space-x-4 mb-6">
        {callState.status === 'idle' && (
          <button
            onClick={createOffer}
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-colors"
            title="Iniciar chamada"
          >
            <Phone size={24} />
          </button>
        )}

        {callState.status === 'ringing' && (
          <>
            <button
              onClick={acceptCall}
              className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-colors"
              title="Aceitar chamada"
            >
              <Phone size={24} />
            </button>
            <button
              onClick={rejectCall}
              className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors"
              title="Rejeitar chamada"
            >
              <PhoneOff size={24} />
            </button>
          </>
        )}

        {(callState.status === 'calling' || callState.status === 'connected') && (
          <>
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-colors ${
                callState.isMuted 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              title={callState.isMuted ? 'Ativar microfone' : 'Silenciar microfone'}
            >
              {callState.isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <button
              onClick={handleCallEnd}
              className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors"
              title="Encerrar chamada"
            >
              <PhoneOff size={24} />
            </button>
          </>
        )}
      </div>

      {/* Status da conexão */}
      <div className="text-center">
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
          callState.status === 'connected' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {callState.status === 'connected' ? 'Conectado' : 'Desconectado'}
        </div>
      </div>

      {/* Elementos de áudio (ocultos) */}
      <div className="hidden">
        <audio ref={localAudioRef} autoPlay muted />
        <audio ref={remoteAudioRef} autoPlay />
      </div>
    </div>
  )
}
