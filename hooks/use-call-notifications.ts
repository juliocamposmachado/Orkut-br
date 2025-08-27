'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

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
      // Enviar resposta de aceite via API
      const response = await fetch('/api/call-notification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: callData.callId,
          action: 'accept'
        })
      })

      if (!response.ok) {
        throw new Error('Falha ao aceitar chamada')
      }

      setIncomingCall(null)
      setIsRinging(false)
      toast.success('Chamada aceita!')
      
    } catch (error) {
      console.error('❌ Erro ao aceitar chamada:', error)
      toast.error('Erro ao aceitar chamada')
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

  return {
    incomingCall,
    isRinging,
    acceptCall,
    rejectCall
  }
}
