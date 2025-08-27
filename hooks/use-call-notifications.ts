'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { WebRTCManager, type WebRTCCallConfig } from '@/lib/webrtc-manager'

export interface IncomingCallData {
  callId: string
  callType: 'audio' | 'video'
  fromUser: {
    id: string
    username: string
    display_name: string
    photo_url?: string
  }
  offer: any
  timestamp: string
}

export function useCallNotifications() {
  const { user } = useAuth()
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null)
  const [isRinging, setIsRinging] = useState(false)
  const [isInCall, setIsInCall] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const webRTCManagerRef = useRef<WebRTCManager | null>(null)

  useEffect(() => {
    if (!user) {
      console.log('⚠️ useCallNotifications: Usuário não encontrado')
      return
    }

    console.log('🔔 Configurando listener para notificações de chamadas...', user.id)

    // Limpar estados anteriores
    setIncomingCall(null)
    setIsRinging(false)

    // Subscrever para notificações de chamadas
    const channel = supabase
      .channel(`call_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Nova notificação recebida:', payload)
          console.log('🔔 Payload completo:', JSON.stringify(payload, null, 2))
          
          const notification = payload.new
          console.log('📋 Notification type:', notification?.type)
          
          // Verificar se é uma notificação de chamada
          if (notification?.type === 'incoming_call') {
            const callData = notification.payload
            
            console.log('📞 CHAMADA DETECTADA! Dados:', callData)
            console.log('🎯 Call ID:', callData?.call_id)
            console.log('📱 Call Type:', callData?.call_type)
            console.log('👤 From User:', callData?.from_user?.display_name)
            
            const incomingCallData = {
              callId: callData.call_id,
              callType: callData.call_type,
              fromUser: callData.from_user,
              offer: callData.offer,
              timestamp: callData.timestamp || new Date().toISOString()
            }
            
            console.log('✅ Setando incomingCall:', incomingCallData)
            setIncomingCall(incomingCallData)
            setIsRinging(true)
            
            // Mostrar toast de notificação
            toast(`📞 Chamada ${callData.call_type === 'video' ? 'de vídeo' : 'de áudio'} de ${callData.from_user.display_name}`, {
              duration: 10000,
              action: {
                label: 'Ver Chamada',
                onClick: () => {
                  console.log('👆 Usuário clicou no toast - chamada já deve estar visível')
                }
              }
            })
          } else {
            console.log('ℹ️ Notificação não é de chamada:', notification?.type)
          }
        }
      )
      .subscribe((status, error) => {
        if (error) {
          console.error('❌ Erro ao subscrever notificações de chamada:', error)
        } else {
          console.log('✅ Subscrito para notificações de chamada. Status:', status)
        }
      })

    // Buscar notificações pendentes ao inicializar (fallback)
    const checkPendingNotifications = async () => {
      try {
        console.log('🔍 Verificando notificações pendentes...')
        const { data: pendingNotifications, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('profile_id', user.id)
          .eq('type', 'incoming_call')
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (error) {
          console.error('❌ Erro ao buscar notificações pendentes:', error)
          return
        }
        
        if (pendingNotifications && pendingNotifications.length > 0) {
          const notification = pendingNotifications[0]
          const callData = notification.payload
          
          console.log('📞 ENCONTRADA notificação pendente:', callData)
          
          setIncomingCall({
            callId: callData.call_id,
            callType: callData.call_type,
            fromUser: callData.from_user,
            offer: callData.offer,
            timestamp: callData.timestamp || notification.created_at
          })
          setIsRinging(true)
        } else {
          console.log('✅ Nenhuma notificação pendente encontrada')
        }
      } catch (error) {
        console.error('❌ Erro ao verificar notificações pendentes:', error)
      }
    }
    
    // Verificar notificações pendentes após 1 segundo
    setTimeout(checkPendingNotifications, 1000)

    return () => {
      console.log('🧹 Limpando listener de notificações de chamada')
      supabase.removeChannel(channel)
    }
  }, [user])

  const acceptCall = async (callData: IncomingCallData) => {
    console.log('✅ Aceitando chamada:', callData.callId)
    
    try {
      // Inicializar WebRTC Manager se não existir
      if (!webRTCManagerRef.current) {
        webRTCManagerRef.current = new WebRTCManager()
        setupWebRTCCallbacks()
      }
      
      const webRTCManager = webRTCManagerRef.current
      
      // Configurar chamada para aceitar
      const callConfig: WebRTCCallConfig = {
        callId: callData.callId,
        callType: callData.callType,
        isInitiator: false,
        remoteUserId: callData.fromUser.id,
        remoteUserInfo: {
          username: callData.fromUser.username,
          display_name: callData.fromUser.display_name,
          photo_url: callData.fromUser.photo_url
        }
      }
      
      console.log('🎮 Aceitando chamada WebRTC:', callConfig)
      
      // Aceitar chamada e criar answer
      const answer = await webRTCManager.acceptCall(callConfig, callData.offer)
      
      // Enviar answer via API de sinalização
      await sendWebRTCSignal(callData.callId, callData.fromUser.id, {
        type: 'answer',
        answer: answer
      })
      
      // Atualizar estados
      setIncomingCall(null)
      setIsRinging(false)
      setIsInCall(true)
      
      // Obter stream local
      const localStreamData = webRTCManager.getLocalStream()
      if (localStreamData) {
        setLocalStream(localStreamData)
      }
      
      // Marcar notificação como lida
      await fetch('/api/call-notification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: callData.callId,
          action: 'accept'
        })
      })
      
      toast.success('Chamada aceita! Conectando...')
      
    } catch (error) {
      console.error('❌ Erro ao aceitar chamada:', error)
      toast.error('Erro ao aceitar chamada: ' + (error as Error).message)
    }
  }

  const rejectCall = async (callId: string) => {
    console.log('❌ Rejeitando chamada:', callId)
    
    try {
      // Enviar resposta de rejeição via API
      const response = await fetch('/api/call-notification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId,
          action: 'reject'
        })
      })

      if (!response.ok) {
        console.warn('Falha ao rejeitar chamada via API')
      }

      setIncomingCall(null)
      setIsRinging(false)
      toast.info('Chamada rejeitada')
      
    } catch (error) {
      console.error('❌ Erro ao rejeitar chamada:', error)
      toast.error('Erro ao rejeitar chamada')
    }
  }

  // Configurar callbacks do WebRTC
  const setupWebRTCCallbacks = () => {
    const webRTCManager = webRTCManagerRef.current!
    
    webRTCManager.onRemoteStream((stream) => {
      console.log('📡 Stream remoto recebido no hook')
      setRemoteStream(stream)
    })
    
    webRTCManager.onConnectionStateChange((state) => {
      console.log('🔄 Estado da conexão WebRTC:', state)
      if (state === 'connected') {
        toast.success('Chamada conectada!')
      } else if (state === 'disconnected' || state === 'failed') {
        toast.info('Chamada desconectada')
        endCall()
      }
    })
    
    webRTCManager.onCallEnded(() => {
      console.log('☎️ Chamada encerrada pelo WebRTC')
      endCall()
    })
    
    webRTCManager.onError((error) => {
      console.error('❌ Erro no WebRTC:', error)
      toast.error('Erro na chamada: ' + error)
    })
  }
  
  // Enviar sinal WebRTC
  const sendWebRTCSignal = async (callId: string, targetUserId: string, message: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Não autenticado')
      }
      
      const response = await fetch('/api/call-signaling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          callId,
          targetUserId,
          message
        })
      })
      
      if (!response.ok) {
        throw new Error('Falha ao enviar sinalização')
      }
      
      console.log('📡 Sinal WebRTC enviado:', message.type)
      
    } catch (error) {
      console.error('❌ Erro ao enviar sinal WebRTC:', error)
    }
  }
  
  // Iniciar chamada
  const startCall = async (targetUserId: string, callType: 'audio' | 'video') => {
    console.log('📞 Iniciando chamada para:', targetUserId)
    
    try {
      // Inicializar WebRTC Manager
      webRTCManagerRef.current = new WebRTCManager()
      setupWebRTCCallbacks()
      
      const webRTCManager = webRTCManagerRef.current
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Buscar informações do usuário alvo
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id, username, display_name, photo_url')
        .eq('id', targetUserId)
        .single()
      
      if (!targetProfile) {
        throw new Error('Usuário não encontrado')
      }
      
      const callConfig: WebRTCCallConfig = {
        callId,
        callType,
        isInitiator: true,
        remoteUserId: targetUserId,
        remoteUserInfo: {
          username: targetProfile.username,
          display_name: targetProfile.display_name,
          photo_url: targetProfile.photo_url
        }
      }
      
      console.log('🎮 Iniciando chamada WebRTC:', callConfig)
      
      // Criar offer
      const offer = await webRTCManager.startCall(callConfig)
      
      // Obter stream local
      const localStreamData = webRTCManager.getLocalStream()
      if (localStreamData) {
        setLocalStream(localStreamData)
      }
      
      // Enviar notificação de chamada tradicional
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Não autenticado')
      }
      
      const response = await fetch('/api/call-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          targetUserId,
          callType,
          offer
        })
      })
      
      if (!response.ok) {
        throw new Error('Falha ao enviar notificação')
      }
      
      setIsInCall(true)
      toast.success('Chamada iniciada! Aguardando resposta...')
      
    } catch (error) {
      console.error('❌ Erro ao iniciar chamada:', error)
      toast.error('Erro ao iniciar chamada: ' + (error as Error).message)
      endCall()
    }
  }
  
  // Encerrar chamada
  const endCall = async () => {
    console.log('☎️ Encerrando chamada...')
    
    try {
      // Encerrar WebRTC
      if (webRTCManagerRef.current) {
        await webRTCManagerRef.current.endCall()
        webRTCManagerRef.current = null
      }
      
      // Limpar estados
      setIsInCall(false)
      setIncomingCall(null)
      setIsRinging(false)
      setLocalStream(null)
      setRemoteStream(null)
      
      toast.info('Chamada encerrada')
      
    } catch (error) {
      console.error('❌ Erro ao encerrar chamada:', error)
    }
  }
  
  // Controles de mídia
  const toggleMicrophone = () => {
    if (webRTCManagerRef.current) {
      return webRTCManagerRef.current.toggleMicrophone()
    }
    return false
  }
  
  const toggleCamera = () => {
    if (webRTCManagerRef.current) {
      return webRTCManagerRef.current.toggleCamera()
    }
    return false
  }

  return {
    incomingCall,
    isRinging,
    isInCall,
    localStream,
    remoteStream,
    acceptCall,
    rejectCall,
    startCall,
    endCall,
    toggleMicrophone,
    toggleCamera
  }
}
