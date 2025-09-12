import { useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface CallSignalMessage {
  type: 'call_offer' | 'call_answer' | 'ice_candidate' | 'call_end' | 'call_reject'
  data: any
  from_user_id: string
  to_user_id: string
  call_type?: 'audio' | 'video'
  timestamp: string
}

export interface CallSignalingHook {
  sendCallOffer: (toUserId: string, offer: RTCSessionDescriptionInit, callType: 'audio' | 'video') => Promise<void>
  sendCallAnswer: (toUserId: string, answer: RTCSessionDescriptionInit) => Promise<void>
  sendIceCandidate: (toUserId: string, candidate: RTCIceCandidateInit) => Promise<void>
  sendCallEnd: (toUserId: string) => Promise<void>
  sendCallReject: (toUserId: string) => Promise<void>
  isConnected: boolean
}

export const useCallSignaling = (
  currentUserId: string,
  onCallOffer: (offer: RTCSessionDescriptionInit, fromUserId: string, callType: 'audio' | 'video') => void,
  onCallAnswer: (answer: RTCSessionDescriptionInit, fromUserId: string) => void,
  onIceCandidate: (candidate: RTCIceCandidateInit, fromUserId: string) => void,
  onCallEnd: (fromUserId: string) => void,
  onCallReject: (fromUserId: string) => void
): CallSignalingHook => {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isConnectedRef = useRef(false)

  // Inicializar canal de sinalização
  useEffect(() => {
    if (!currentUserId || !supabase) {
      return
    }

    console.log('📡 Inicializando canal de sinalização para usuário:', currentUserId)

    // Criar canal único para o usuário
    const channel = supabase.channel(`call_signaling_${currentUserId}`, {
      config: {
        presence: {
          key: currentUserId
        }
      }
    })

    // Escutar mensagens de sinalização
    channel
      .on('broadcast', { event: 'call_signal' }, (payload) => {
        const message = payload.payload as CallSignalMessage
        
        console.log('📨 Mensagem de sinalização recebida:', message)

        // Verificar se a mensagem é para este usuário
        if (message.to_user_id !== currentUserId) {
          return
        }

        // Processar diferentes tipos de mensagem
        switch (message.type) {
          case 'call_offer':
            console.log('📞 Oferta de chamada recebida de:', message.from_user_id)
            onCallOffer(message.data, message.from_user_id, message.call_type || 'audio')
            break

          case 'call_answer':
            console.log('✅ Resposta de chamada recebida de:', message.from_user_id)
            onCallAnswer(message.data, message.from_user_id)
            break

          case 'ice_candidate':
            console.log('🧊 ICE candidate recebido de:', message.from_user_id)
            onIceCandidate(message.data, message.from_user_id)
            break

          case 'call_end':
            console.log('📞 Chamada encerrada por:', message.from_user_id)
            onCallEnd(message.from_user_id)
            break

          case 'call_reject':
            console.log('❌ Chamada rejeitada por:', message.from_user_id)
            onCallReject(message.from_user_id)
            break

          default:
            console.log('⚠️ Tipo de mensagem desconhecido:', message.type)
        }
      })
      .subscribe((status) => {
        console.log('📡 Status do canal de sinalização:', status)
        isConnectedRef.current = status === 'SUBSCRIBED'
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Canal de sinalização conectado')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro no canal de sinalização')
        }
      })

    channelRef.current = channel

    return () => {
      console.log('🔌 Desconectando canal de sinalização')
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
      isConnectedRef.current = false
    }
  }, [currentUserId, supabase, onCallOffer, onCallAnswer, onIceCandidate, onCallEnd, onCallReject])

  // Enviar oferta de chamada
  const sendCallOffer = useCallback(async (
    toUserId: string, 
    offer: RTCSessionDescriptionInit, 
    callType: 'audio' | 'video'
  ) => {
    if (!channelRef.current || !isConnectedRef.current) {
      throw new Error('Canal de sinalização não está conectado')
    }

    const message: CallSignalMessage = {
      type: 'call_offer',
      data: offer,
      from_user_id: currentUserId,
      to_user_id: toUserId,
      call_type: callType,
      timestamp: new Date().toISOString()
    }

    console.log('📤 Enviando oferta de chamada:', message)

    const result = await channelRef.current.send({
      type: 'broadcast',
      event: 'call_signal',
      payload: message
    })

    if (result !== 'ok') {
      throw new Error('Falha ao enviar oferta de chamada')
    }
  }, [currentUserId])

  // Enviar resposta de chamada
  const sendCallAnswer = useCallback(async (toUserId: string, answer: RTCSessionDescriptionInit) => {
    if (!channelRef.current || !isConnectedRef.current) {
      throw new Error('Canal de sinalização não está conectado')
    }

    const message: CallSignalMessage = {
      type: 'call_answer',
      data: answer,
      from_user_id: currentUserId,
      to_user_id: toUserId,
      timestamp: new Date().toISOString()
    }

    console.log('📤 Enviando resposta de chamada:', message)

    const result = await channelRef.current.send({
      type: 'broadcast',
      event: 'call_signal',
      payload: message
    })

    if (result !== 'ok') {
      throw new Error('Falha ao enviar resposta de chamada')
    }
  }, [currentUserId])

  // Enviar ICE candidate
  const sendIceCandidate = useCallback(async (toUserId: string, candidate: RTCIceCandidateInit) => {
    if (!channelRef.current || !isConnectedRef.current) {
      console.warn('⚠️ Canal não conectado, ignorando ICE candidate')
      return
    }

    const message: CallSignalMessage = {
      type: 'ice_candidate',
      data: candidate,
      from_user_id: currentUserId,
      to_user_id: toUserId,
      timestamp: new Date().toISOString()
    }

    console.log('📤 Enviando ICE candidate:', message)

    const result = await channelRef.current.send({
      type: 'broadcast',
      event: 'call_signal',
      payload: message
    })

    if (result !== 'ok') {
      console.error('❌ Falha ao enviar ICE candidate')
    }
  }, [currentUserId])

  // Enviar fim de chamada
  const sendCallEnd = useCallback(async (toUserId: string) => {
    if (!channelRef.current || !isConnectedRef.current) {
      console.warn('⚠️ Canal não conectado, não foi possível notificar fim da chamada')
      return
    }

    const message: CallSignalMessage = {
      type: 'call_end',
      data: null,
      from_user_id: currentUserId,
      to_user_id: toUserId,
      timestamp: new Date().toISOString()
    }

    console.log('📤 Enviando fim de chamada:', message)

    const result = await channelRef.current.send({
      type: 'broadcast',
      event: 'call_signal',
      payload: message
    })

    if (result !== 'ok') {
      console.error('❌ Falha ao enviar fim de chamada')
    }
  }, [currentUserId])

  // Enviar rejeição de chamada
  const sendCallReject = useCallback(async (toUserId: string) => {
    if (!channelRef.current || !isConnectedRef.current) {
      console.warn('⚠️ Canal não conectado, não foi possível notificar rejeição')
      return
    }

    const message: CallSignalMessage = {
      type: 'call_reject',
      data: null,
      from_user_id: currentUserId,
      to_user_id: toUserId,
      timestamp: new Date().toISOString()
    }

    console.log('📤 Enviando rejeição de chamada:', message)

    const result = await channelRef.current.send({
      type: 'broadcast',
      event: 'call_signal',
      payload: message
    })

    if (result !== 'ok') {
      console.error('❌ Falha ao enviar rejeição de chamada')
    }
  }, [currentUserId])

  return {
    sendCallOffer,
    sendCallAnswer,
    sendIceCandidate,
    sendCallEnd,
    sendCallReject,
    isConnected: isConnectedRef.current
  }
}
