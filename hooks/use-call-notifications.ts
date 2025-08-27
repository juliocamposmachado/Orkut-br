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
    if (!user) return

    console.log('🔔 Configurando listener para notificações de chamadas...', user.id)

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
          
          const notification = payload.new
          
          // Verificar se é uma notificação de chamada
          if (notification.type === 'incoming_call') {
            const callData = notification.payload
            
            console.log('📞 Notificação de chamada detectada:', callData)
            
            setIncomingCall({
              callId: callData.call_id,
              callType: callData.call_type,
              fromUser: callData.from_user,
              offer: callData.offer,
              timestamp: callData.timestamp
            })
            
            setIsRinging(true)
            
            // Mostrar toast de notificação
            toast(`📞 Chamada ${callData.call_type === 'video' ? 'de vídeo' : 'de áudio'} de ${callData.from_user.display_name}`, {
              duration: 5000,
              action: {
                label: 'Atender',
                onClick: () => {
                  // A lógica de aceitar será implementada no componente
                  console.log('Usuário clicou em atender via toast')
                }
              }
            })
          }
        }
      )
      .subscribe((status, error) => {
        if (error) {
          console.error('❌ Erro ao subscrever notificações de chamada:', error)
        } else {
          console.log('✅ Subscrito para notificações de chamada:', status)
        }
      })

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
