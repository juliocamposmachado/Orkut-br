'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
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

    console.log('✅ useCallNotifications: Modo simplificado ativado (sem polling)')
    // MODO SIMPLIFICADO - SEM LISTENERS REAIS

    // Limpar estados
    setIncomingCall(null)
    setIsRinging(false)
    setIsInCall(false)
    
    // Sem listeners no modo simplificado
    console.log('🗋 Modo simplificado: sem listeners de chamadas')
    
    return () => {
      console.log('🧧 Limpeza simplificada de useCallNotifications')
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
      try {
        const { data: { session } } = await supabase.auth.getSession()
        await fetch('/api/call-notification', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
          },
          body: JSON.stringify({
            callId: callData.callId,
            action: 'accept'
          })
        })
      } catch (sessionError) {
        console.warn('Erro ao obter sessão para marcar notificação:', sessionError)
      }
      
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
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch('/api/call-notification', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
          },
          body: JSON.stringify({
            callId,
            action: 'reject'
          })
        })
        
        if (!response.ok) {
          console.warn('Falha ao rejeitar chamada via API')
        }
      } catch (sessionError) {
        console.warn('Erro ao obter sessão para rejeitar chamada:', sessionError)
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
        console.warn('Não autenticado para enviar sinal WebRTC')
        return
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
      try {
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
      } catch (notificationError) {
        console.warn('Erro ao enviar notificação de chamada:', notificationError)
        // Continua mesmo com erro na notificação
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
  
  // Processar sinalização WebRTC
  const handleWebRTCSignaling = (signalPayload: any) => {
    console.log('📡 Processando sinal WebRTC:', signalPayload)
    
    if (!webRTCManagerRef.current) {
      console.warn('⚠️ WebRTC Manager não inicializado para processar sinal')
      return
    }
    
    const { message, fromUserId, targetUserId } = signalPayload
    
    // Verificar se o sinal é para este usuário
    if (targetUserId !== user?.id) {
      console.log('ℹ️ Sinal não é para este usuário')
      return
    }
    
    try {
      switch (message.type) {
        case 'offer':
          console.log('📥 Processando offer WebRTC')
          // Offer será processado via acceptCall
          break
          
        case 'answer':
          console.log('📥 Processando answer WebRTC')
          if (message.answer) {
            webRTCManagerRef.current.processAnswer(message.answer)
          }
          break
          
        case 'ice-candidate':
          console.log('🧊 Processando ICE candidate')
          if (message.candidate) {
            webRTCManagerRef.current.addIceCandidate(message.candidate)
          }
          break
          
        case 'call-ended':
          console.log('📞 Chamada encerrada remotamente')
          endCall()
          break
          
        default:
          console.warn('⚠️ Tipo de sinal WebRTC desconhecido:', message.type)
      }
    } catch (error) {
      console.error('❌ Erro ao processar sinal WebRTC:', error)
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

  // Log estados em tempo real para debug
  useEffect(() => {
    console.log('🔄 [useCallNotifications] Estados atuais:', {
      hasIncomingCall: !!incomingCall,
      callId: incomingCall?.callId,
      fromUser: incomingCall?.fromUser?.display_name,
      isRinging,
      isInCall,
      hasLocalStream: !!localStream,
      hasRemoteStream: !!remoteStream
    })
  }, [incomingCall, isRinging, isInCall, localStream, remoteStream])

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
