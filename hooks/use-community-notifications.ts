import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface CommunityNotification {
  id: number
  profile_id: string
  type: string
  payload: {
    community_id?: number
    community_name?: string
    inviter_name?: string
    invitation_code?: string
    message?: string
    action_type?: string
    moderator_name?: string
    new_role?: string
    previous_role?: string
    requester_name?: string
    post_id?: number
  }
  read: boolean
  created_at: string
}

export function useCommunityNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<CommunityNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadNotifications()
      subscribeToNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', user?.id)
        .in('type', [
          'community_invitation',
          'community_join_request',
          'community_role_changed',
          'community_post_approved',
          'community_post_rejected',
          'community_announcement',
          'community_member_joined',
          'community_member_left'
        ])
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Erro ao carregar notificações de comunidades:', error)
        return
      }

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.read).length || 0)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToNotifications = () => {
    if (!user) return

    const channel = supabase
      .channel('community_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as CommunityNotification
          
          // Apenas processar notificações de comunidades
          if (newNotification.type.startsWith('community_')) {
            setNotifications(prev => [newNotification, ...prev])
            setUnreadCount(prev => prev + 1)
            
            // Mostrar toast para notificações importantes
            showNotificationToast(newNotification)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const showNotificationToast = (notification: CommunityNotification) => {
    const { type, payload } = notification

    switch (type) {
      case 'community_invitation':
        toast.success(`🎉 Você foi convidado para a comunidade "${payload.community_name}"!`, {
          description: `Convite de ${payload.inviter_name}`,
          action: {
            label: 'Ver Convite',
            onClick: () => handleNotificationClick(notification)
          }
        })
        break

      case 'community_join_request':
        toast.info(`👤 Nova solicitação para sua comunidade "${payload.community_name}"`, {
          description: `Solicitação de ${payload.requester_name}`,
          action: {
            label: 'Gerenciar',
            onClick: () => handleNotificationClick(notification)
          }
        })
        break

      case 'community_role_changed':
        const roleMessage = payload.new_role === 'admin' ? 'promovido a administrador' :
                           payload.new_role === 'moderator' ? 'promovido a moderador' :
                           'rebaixado a membro'
        
        toast.success(`👑 Você foi ${roleMessage} na comunidade "${payload.community_name}"!`, {
          description: `Ação realizada por ${payload.moderator_name}`
        })
        break

      case 'community_post_approved':
        toast.success(`✅ Seu post foi aprovado na comunidade "${payload.community_name}"!`)
        break

      case 'community_post_rejected':
        toast.error(`❌ Seu post foi rejeitado na comunidade "${payload.community_name}"`, {
          description: 'Verifique se segue as regras da comunidade'
        })
        break

      case 'community_announcement':
        toast.info(`📢 Novo anúncio na comunidade "${payload.community_name}"!`, {
          action: {
            label: 'Ver Anúncio',
            onClick: () => handleNotificationClick(notification)
          }
        })
        break

      case 'community_member_joined':
        toast.info(`🎉 Novo membro entrou na comunidade "${payload.community_name}"!`)
        break
    }
  }

  const handleNotificationClick = (notification: CommunityNotification) => {
    const { type, payload } = notification

    // Marcar como lida
    markAsRead(notification.id)

    // Navegar para a página apropriada
    switch (type) {
      case 'community_invitation':
        if (payload.invitation_code) {
          window.open(`/comunidades/convite/${payload.invitation_code}`, '_blank')
        }
        break

      case 'community_join_request':
      case 'community_announcement':
        if (payload.community_id) {
          window.open(`/comunidades/${payload.community_id}`, '_blank')
        }
        break

      case 'community_role_changed':
      case 'community_member_joined':
        if (payload.community_id) {
          window.open(`/comunidades/${payload.community_id}`, '_blank')
        }
        break

      case 'community_post_approved':
      case 'community_post_rejected':
        if (payload.community_id) {
          window.open(`/comunidades/${payload.community_id}`, '_blank')
        }
        break
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (!error) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      
      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds)

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
        toast.success('Todas as notificações foram marcadas como lidas')
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      toast.error('Erro ao marcar notificações como lidas')
    }
  }

  const deleteNotification = async (notificationId: number) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (!error) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setUnreadCount(prev => {
          const notification = notifications.find(n => n.id === notificationId)
          return notification && !notification.read ? prev - 1 : prev
        })
        toast.success('Notificação removida')
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
      toast.error('Erro ao remover notificação')
    }
  }

  const getNotificationTitle = (notification: CommunityNotification) => {
    const { type, payload } = notification

    switch (type) {
      case 'community_invitation':
        return `Convite para "${payload.community_name}"`
      case 'community_join_request':
        return `Nova solicitação para "${payload.community_name}"`
      case 'community_role_changed':
        return `Mudança de papel em "${payload.community_name}"`
      case 'community_post_approved':
        return `Post aprovado em "${payload.community_name}"`
      case 'community_post_rejected':
        return `Post rejeitado em "${payload.community_name}"`
      case 'community_announcement':
        return `Anúncio em "${payload.community_name}"`
      case 'community_member_joined':
        return `Novo membro em "${payload.community_name}"`
      case 'community_member_left':
        return `Membro saiu de "${payload.community_name}"`
      default:
        return 'Notificação de comunidade'
    }
  }

  const getNotificationDescription = (notification: CommunityNotification) => {
    const { type, payload } = notification

    switch (type) {
      case 'community_invitation':
        return `${payload.inviter_name} convidou você para participar`
      case 'community_join_request':
        return `${payload.requester_name} quer entrar na sua comunidade`
      case 'community_role_changed':
        const roleText = payload.new_role === 'admin' ? 'administrador' :
                        payload.new_role === 'moderator' ? 'moderador' : 'membro'
        return `Você foi promovido a ${roleText} por ${payload.moderator_name}`
      case 'community_post_approved':
        return 'Seu post foi aprovado e está visível para todos'
      case 'community_post_rejected':
        return 'Seu post não atende às diretrizes da comunidade'
      case 'community_announcement':
        return 'Há um novo anúncio importante para você'
      case 'community_member_joined':
        return 'A comunidade está crescendo!'
      case 'community_member_left':
        return 'Um membro deixou a comunidade'
      default:
        return 'Nova atividade na comunidade'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'community_invitation': return '✉️'
      case 'community_join_request': return '👤'
      case 'community_role_changed': return '👑'
      case 'community_post_approved': return '✅'
      case 'community_post_rejected': return '❌'
      case 'community_announcement': return '📢'
      case 'community_member_joined': return '🎉'
      case 'community_member_left': return '👋'
      default: return '🔔'
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationClick,
    getNotificationTitle,
    getNotificationDescription,
    getNotificationIcon,
    refreshNotifications: loadNotifications
  }
}
