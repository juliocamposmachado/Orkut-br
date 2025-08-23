'use client'

import type { NotificationSettings } from '@/hooks/use-notification-settings'

export interface NotificationData {
  type: 'like' | 'comment' | 'share' | 'friend_request' | 'mention' | 'post_from_friend' | 'community_activity'
  title: string
  message: string
  fromUser?: {
    id: string
    name: string
    photo?: string
    username: string
  }
  post?: {
    id: number
    content: string
  }
  actionUrl?: string
  timestamp?: string
}

class NotificationService {
  private static instance: NotificationService
  private settings: NotificationSettings | null = null

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  // Definir configurações de notificação
  setSettings(settings: NotificationSettings) {
    this.settings = settings
  }

  // Verificar se deve mostrar notificação
  private shouldShowNotification(type: NotificationData['type']): boolean {
    if (!this.settings) return false

    // Mapear tipos para configurações
    const typeMap: Record<NotificationData['type'], keyof NotificationSettings> = {
      like: 'likes',
      comment: 'comments',
      share: 'shares',
      friend_request: 'friend_requests',
      mention: 'mentions',
      post_from_friend: 'posts_from_friends',
      community_activity: 'community_activity'
    }

    const settingKey = typeMap[type]
    if (!settingKey) return false

    // Verificar se o tipo está habilitado
    if (!this.settings[settingKey]) return false

    // Verificar se notificações push estão habilitadas
    if (!this.settings.browser_push) return false

    // Verificar horário silencioso
    if (this.settings.quiet_hours_enabled && this.isQuietHours()) return false

    // Verificar permissão do navegador
    if (Notification.permission !== 'granted') return false

    return true
  }

  // Verificar se está em horário silencioso
  private isQuietHours(): boolean {
    if (!this.settings?.quiet_hours_enabled) return false

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    const [startHour, startMin] = this.settings.quiet_hours_start.split(':').map(Number)
    const [endHour, endMin] = this.settings.quiet_hours_end.split(':').map(Number)
    
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin
    
    // Se o horário de fim é menor que o de início, significa que atravessa meia-noite
    if (endTime < startTime) {
      return currentTime >= startTime || currentTime <= endTime
    } else {
      return currentTime >= startTime && currentTime <= endTime
    }
  }

  // Tocar som da notificação
  private playNotificationSound() {
    if (!this.settings?.sound_enabled) return

    // Criar um áudio simples usando Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      console.log('Could not play notification sound:', error)
    }
  }

  // Gerar ícone baseado no tipo de notificação
  private getNotificationIcon(type: NotificationData['type']): string {
    const baseUrl = window.location.origin
    
    // Por enquanto, usar ícone padrão - você pode criar ícones específicos depois
    return `${baseUrl}/favicon.ico`
  }

  // Gerar badge baseado no tipo
  private getNotificationBadge(type: NotificationData['type']): string {
    // Para diferentes tipos, você pode ter badges diferentes
    const badges: Record<NotificationData['type'], string> = {
      like: '❤️',
      comment: '💬', 
      share: '🔄',
      friend_request: '👥',
      mention: '📢',
      post_from_friend: '📝',
      community_activity: '🏘️'
    }

    return badges[type] || '🔔'
  }

  // Enviar notificação push
  async sendNotification(data: NotificationData): Promise<boolean> {
    // Verificar se deve mostrar a notificação
    if (!this.shouldShowNotification(data.type)) {
      console.log('Notification blocked by user settings:', data.type)
      return false
    }

    try {
      // Preparar dados da notificação
      const notificationTitle = data.title
      let notificationBody = data.message

      // Se preview estiver desabilitado, não mostrar conteúdo detalhado
      if (!this.settings?.notification_preview) {
        notificationBody = this.getGenericMessage(data.type)
      }

      // Opções da notificação
      const options: NotificationOptions = {
        body: notificationBody,
        icon: data.fromUser?.photo || this.getNotificationIcon(data.type),
        badge: this.getNotificationBadge(data.type),
        tag: `orkut-${data.type}-${data.timestamp || Date.now()}`,
        requireInteraction: data.type === 'friend_request', // Solicitações de amizade requerem interação
        actions: this.getNotificationActions(data),
        data: {
          type: data.type,
          fromUser: data.fromUser,
          post: data.post,
          actionUrl: data.actionUrl,
          timestamp: data.timestamp || new Date().toISOString()
        },
        timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now()
      }

      // Criar e mostrar notificação
      const notification = new Notification(notificationTitle, options)

      // Configurar evento de clique
      notification.onclick = (event) => {
        event.preventDefault()
        window.focus()
        
        // Navegar para a URL de ação se existir
        if (data.actionUrl) {
          window.open(data.actionUrl, '_self')
        }
        
        notification.close()
      }

      // Auto-fechar após 5 segundos (exceto solicitações de amizade)
      if (data.type !== 'friend_request') {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      // Tocar som se habilitado
      this.playNotificationSound()

      console.log('Notification sent successfully:', data.type)
      return true

    } catch (error) {
      console.error('Error sending notification:', error)
      return false
    }
  }

  // Mensagens genéricas quando preview está desabilitado
  private getGenericMessage(type: NotificationData['type']): string {
    const messages: Record<NotificationData['type'], string> = {
      like: 'Alguém curtiu seu post',
      comment: 'Você recebeu um novo comentário',
      share: 'Seu post foi compartilhado',
      friend_request: 'Nova solicitação de amizade',
      mention: 'Você foi mencionado',
      post_from_friend: 'Um amigo fez uma nova publicação',
      community_activity: 'Nova atividade em suas comunidades'
    }

    return messages[type] || 'Nova notificação'
  }

  // Ações disponíveis na notificação
  private getNotificationActions(data: NotificationData): NotificationAction[] {
    const actions: NotificationAction[] = []

    switch (data.type) {
      case 'friend_request':
        actions.push(
          { action: 'accept', title: '✅ Aceitar', icon: '/icons/accept.png' },
          { action: 'decline', title: '❌ Recusar', icon: '/icons/decline.png' }
        )
        break
      
      case 'like':
      case 'comment':
      case 'share':
        actions.push(
          { action: 'view', title: '👀 Ver post', icon: '/icons/view.png' }
        )
        break
      
      case 'mention':
        actions.push(
          { action: 'reply', title: '💬 Responder', icon: '/icons/reply.png' },
          { action: 'view', title: '👀 Ver', icon: '/icons/view.png' }
        )
        break
    }

    return actions
  }

  // Criar notificação para curtida
  async sendLikeNotification(fromUser: NotificationData['fromUser'], post: NotificationData['post']) {
    if (!fromUser || !post) return false

    return this.sendNotification({
      type: 'like',
      title: '❤️ Nova curtida!',
      message: `${fromUser.name} curtiu seu post`,
      fromUser,
      post,
      actionUrl: `/post/${post.id}`,
      timestamp: new Date().toISOString()
    })
  }

  // Criar notificação para comentário
  async sendCommentNotification(fromUser: NotificationData['fromUser'], post: NotificationData['post'], comment?: string) {
    if (!fromUser || !post) return false

    const previewComment = comment && this.settings?.notification_preview 
      ? `: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`
      : ''

    return this.sendNotification({
      type: 'comment',
      title: '💬 Novo comentário!',
      message: `${fromUser.name} comentou em seu post${previewComment}`,
      fromUser,
      post,
      actionUrl: `/post/${post.id}#comments`,
      timestamp: new Date().toISOString()
    })
  }

  // Criar notificação para compartilhamento
  async sendShareNotification(fromUser: NotificationData['fromUser'], post: NotificationData['post']) {
    if (!fromUser || !post) return false

    return this.sendNotification({
      type: 'share',
      title: '🔄 Post compartilhado!',
      message: `${fromUser.name} compartilhou seu post`,
      fromUser,
      post,
      actionUrl: `/perfil/${fromUser.username}`,
      timestamp: new Date().toISOString()
    })
  }

  // Criar notificação para solicitação de amizade
  async sendFriendRequestNotification(fromUser: NotificationData['fromUser']) {
    if (!fromUser) return false

    return this.sendNotification({
      type: 'friend_request',
      title: '👥 Nova solicitação de amizade!',
      message: `${fromUser.name} quer ser seu amigo`,
      fromUser,
      actionUrl: `/perfil/${fromUser.username}`,
      timestamp: new Date().toISOString()
    })
  }

  // Criar notificação para menção
  async sendMentionNotification(fromUser: NotificationData['fromUser'], post: NotificationData['post'], context?: string) {
    if (!fromUser) return false

    const contextText = context && this.settings?.notification_preview
      ? ` em: "${context.substring(0, 50)}${context.length > 50 ? '...' : ''}"`
      : ''

    return this.sendNotification({
      type: 'mention',
      title: '📢 Você foi mencionado!',
      message: `${fromUser.name} mencionou você${contextText}`,
      fromUser,
      post,
      actionUrl: post ? `/post/${post.id}` : `/perfil/${fromUser.username}`,
      timestamp: new Date().toISOString()
    })
  }

  // Limpar notificações antigas
  clearOldNotifications() {
    // Esta funcionalidade precisa de Service Worker para funcionar completamente
    console.log('Clearing old notifications...')
  }

  // Verificar suporte a notificações
  static checkSupport(): { supported: boolean; reason?: string } {
    if (!('Notification' in window)) {
      return { supported: false, reason: 'Notificações não são suportadas neste navegador' }
    }
    
    if (!('serviceWorker' in navigator)) {
      return { supported: false, reason: 'Service Workers não são suportados' }
    }

    return { supported: true }
  }

  // Obter estatísticas de notificações
  getStats(): { permission: NotificationPermission; supported: boolean } {
    return {
      permission: Notification.permission,
      supported: NotificationService.checkSupport().supported
    }
  }
}

// Exportar instância singleton
export const notificationService = NotificationService.getInstance()

// Exportar classe para casos específicos
export default NotificationService
