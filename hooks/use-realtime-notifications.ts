'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import { notificationService } from '@/lib/notification-service'
import { useNotificationSettings } from '@/hooks/use-notification-settings'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeNotification {
  id: number
  profile_id: string
  type: 'like' | 'comment' | 'share' | 'friend_request' | 'mention' | 'post_from_friend'
  payload: {
    from_user: {
      id: string
      display_name: string
      photo_url?: string
      username: string
    }
    post?: {
      id: number
      content: string
    }
    comment?: string
    action_url?: string
  }
  read: boolean
  created_at: string
}

export function useRealtimeNotifications() {
  const { user } = useAuth()
  const { settings } = useNotificationSettings()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isConnectedRef = useRef(false)

  // Processar notificação recebida em tempo real
  const handleRealtimeNotification = useCallback(async (notification: RealtimeNotification) => {
    console.log('Received realtime notification:', notification)

    // Atualizar configurações do serviço de notificação
    if (settings) {
      notificationService.setSettings(settings)
    }

    try {
      // Mapear tipo de notificação
      const typeMap: Record<string, Parameters<typeof notificationService.sendNotification>[0]['type']> = {
        'like': 'like',
        'comment': 'comment',
        'share': 'share',
        'friend_request': 'friend_request',
        'mention': 'mention',
        'post_from_friend': 'post_from_friend'
      }

      const mappedType = typeMap[notification.type]
      if (!mappedType) {
        console.warn('Unknown notification type:', notification.type)
        return
      }

      // Preparar dados baseados no tipo
      let title = ''
      let message = ''

      switch (notification.type) {
        case 'like':
          title = '❤️ Nova curtida!'
          message = `${notification.payload.from_user.display_name} curtiu seu post`
          break
        case 'comment':
          title = '💬 Novo comentário!'
          message = `${notification.payload.from_user.display_name} comentou em seu post`
          if (notification.payload.comment && settings?.notification_preview) {
            message += `: "${notification.payload.comment.substring(0, 50)}${notification.payload.comment.length > 50 ? '...' : ''}"`
          }
          break
        case 'share':
          title = '🔄 Post compartilhado!'
          message = `${notification.payload.from_user.display_name} compartilhou seu post`
          break
        case 'friend_request':
          title = '👥 Nova solicitação de amizade!'
          message = `${notification.payload.from_user.display_name} quer ser seu amigo`
          break
        case 'mention':
          title = '📢 Você foi mencionado!'
          message = `${notification.payload.from_user.display_name} mencionou você`
          break
        case 'post_from_friend':
          title = '📝 Novo post de amigo!'
          message = `${notification.payload.from_user.display_name} fez uma nova publicação`
          break
      }

      // Enviar notificação push
      await notificationService.sendNotification({
        type: mappedType,
        title,
        message,
        fromUser: {
          id: notification.payload.from_user.id,
          name: notification.payload.from_user.display_name,
          photo: notification.payload.from_user.photo_url,
          username: notification.payload.from_user.username
        },
        post: notification.payload.post,
        actionUrl: notification.payload.action_url || `/post/${notification.payload.post?.id}`,
        timestamp: notification.created_at
      })

      // Também salvar no sistema de notificações local (dropdown)
      const existingNotifications = JSON.parse(
        localStorage.getItem(`notifications_${user?.id}`) || '[]'
      )

      const newNotification = {
        id: notification.id.toString(),
        type: notification.type,
        title: title.replace(/📝|❤️|💬|🔄|👥|📢|\s/g, '').trim(),
        message: message.replace(notification.payload.from_user.display_name, '').trim(),
        read: false,
        created_at: notification.created_at,
        from_user: notification.payload.from_user,
        post: notification.payload.post
      }

      // Adicionar nova notificação ao início da lista
      const updatedNotifications = [newNotification, ...existingNotifications].slice(0, 50) // Manter apenas 50 mais recentes

      localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(updatedNotifications))

      // Disparar evento personalizado para atualizar o dropdown
      window.dispatchEvent(new CustomEvent('notificationUpdate', {
        detail: { notifications: updatedNotifications }
      }))

    } catch (error) {
      console.error('Error processing realtime notification:', error)
    }
  }, [settings, user])

  // Conectar ao canal de notificações
  const connectToNotifications = useCallback(() => {
    if (!user || isConnectedRef.current) return

    try {
      console.log('Connecting to realtime notifications for user:', user.id)

      // Criar canal para notificações do usuário
      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `profile_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Realtime notification received:', payload)
            handleRealtimeNotification(payload.new as RealtimeNotification)
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status)
          if (status === 'SUBSCRIBED') {
            isConnectedRef.current = true
            console.log('✅ Connected to realtime notifications')
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            isConnectedRef.current = false
            console.log('❌ Disconnected from realtime notifications')
          }
        })

      channelRef.current = channel

    } catch (error) {
      console.error('Error connecting to realtime notifications:', error)
    }
  }, [user, handleRealtimeNotification])

  // Desconectar do canal
  const disconnectFromNotifications = useCallback(() => {
    if (channelRef.current) {
      console.log('Disconnecting from realtime notifications')
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      isConnectedRef.current = false
    }
  }, [])

  // Testar notificação em tempo real (para desenvolvimento)
  const testRealtimeNotification = useCallback(async () => {
    if (!user) return

    console.log('Testing realtime notification...')

    try {
      // Inserir uma notificação de teste no banco
      const testNotification = {
        profile_id: user.id,
        type: 'like',
        payload: {
          from_user: {
            id: 'test-user',
            display_name: 'Usuário Teste',
            photo_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
            username: 'teste'
          },
          post: {
            id: 1,
            content: 'Post de teste para notificação'
          },
          action_url: '/post/1'
        },
        read: false
      }

      const { error } = await supabase
        .from('notifications')
        .insert(testNotification)

      if (error) {
        console.error('Error sending test notification:', error)
        // Se falhar no Supabase, simular localmente
        handleRealtimeNotification({
          id: Date.now(),
          profile_id: user.id,
          type: 'like',
          payload: testNotification.payload,
          read: false,
          created_at: new Date().toISOString()
        })
      }

    } catch (error) {
      console.error('Error testing realtime notification:', error)
    }
  }, [user, handleRealtimeNotification])

  // Conectar quando user estiver disponível
  useEffect(() => {
    if (user && !isConnectedRef.current) {
      // Pequeno delay para garantir que outros hooks estejam prontos
      const timer = setTimeout(() => {
        connectToNotifications()
      }, 1000)

      return () => clearTimeout(timer)
    }

    return () => {
      disconnectFromNotifications()
    }
  }, [user, connectToNotifications, disconnectFromNotifications])

  // Atualizar configurações do serviço quando mudarem
  useEffect(() => {
    if (settings) {
      notificationService.setSettings(settings)
    }
  }, [settings])

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      disconnectFromNotifications()
    }
  }, [disconnectFromNotifications])

  return {
    isConnected: isConnectedRef.current,
    connectToNotifications,
    disconnectFromNotifications,
    testRealtimeNotification
  }
}

// Hook simplificado para componentes que só precisam das notificações ativas
export function useNotificationConnection() {
  return useRealtimeNotifications()
}
