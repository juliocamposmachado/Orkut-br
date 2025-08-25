'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  Share, 
  UserPlus,
  Settings,
  Check,
  Trash2,
  X
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'share' | 'friend_request' | 'friend_request_accepted' | 'mention'
  title: string
  message: string
  read: boolean
  created_at: string
  from_user: {
    id: string
    display_name: string
    photo_url: string | null
    username: string
  }
  post?: {
    id: number
    content: string
  }
}

export function NotificationsDropdown() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Escutar eventos de atualização de notificações
  useEffect(() => {
    const handleNotificationUpdate = (event: any) => {
      const { notifications: updatedNotifications } = event.detail
      setNotifications(updatedNotifications)
      setUnreadCount(updatedNotifications.filter((n: Notification) => !n.read).length)
    }

    window.addEventListener('notificationUpdate', handleNotificationUpdate)
    return () => {
      window.removeEventListener('notificationUpdate', handleNotificationUpdate)
    }
  }, [])

  // Load notifications from database and localStorage fallback
  const loadNotifications = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      let loadedNotifications: Notification[] = []

      // Try to load from database first
      if (supabase) {
        try {
          const { data: dbNotifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('profile_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

          if (!error && dbNotifications) {
            // Transform database notifications to component format
            loadedNotifications = dbNotifications.map(dbNotif => ({
              id: dbNotif.id.toString(),
              type: dbNotif.type,
              title: getNotificationTitle(dbNotif.type),
              message: getNotificationMessage(dbNotif.type, dbNotif.payload?.from_user?.display_name || ''),
              read: dbNotif.read || false,
              created_at: dbNotif.created_at,
              from_user: {
                id: dbNotif.payload?.from_user?.id || '',
                display_name: dbNotif.payload?.from_user?.display_name || '',
                photo_url: dbNotif.payload?.from_user?.photo_url || null,
                username: dbNotif.payload?.from_user?.username || ''
              },
              post: dbNotif.payload?.post ? {
                id: dbNotif.payload.post.id,
                content: dbNotif.payload.post.content
              } : undefined
            }))
            
            console.log(`✅ Loaded ${loadedNotifications.length} notifications from database`)
          } else {
            console.warn('Database notifications failed:', error?.message)
          }
        } catch (dbError) {
          console.warn('Database error, trying localStorage:', dbError)
        }
      }

      // Fallback to localStorage if no database notifications
      if (loadedNotifications.length === 0) {
        const saved = localStorage.getItem(`notifications_${user.id}`)
        if (saved) {
          loadedNotifications = JSON.parse(saved)
          console.log(`📦 Loaded ${loadedNotifications.length} notifications from localStorage`)
        }
      }

      setNotifications(loadedNotifications)
      setUnreadCount(loadedNotifications.filter((n: Notification) => !n.read).length)
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper functions for notification titles and messages
  const getNotificationTitle = (type: string): string => {
    const titles: Record<string, string> = {
      'like': 'Curtiu seu post',
      'comment': 'Comentou no seu post',
      'share': 'Compartilhou seu post',
      'friend_request': 'Solicitação de amizade',
      'friend_request_accepted': 'Pedido aceito',
      'mention': 'Mencionou você'
    }
    return titles[type] || 'Nova notificação'
  }

  const getNotificationMessage = (type: string, userName: string): string => {
    const messages: Record<string, string> = {
      'like': 'curtiu seu post',
      'comment': 'comentou em seu post',
      'share': 'compartilhou seu post',
      'friend_request': 'enviou uma solicitação de amizade',
      'friend_request_accepted': 'aceitou sua solicitação de amizade',
      'mention': 'mencionou você'
    }
    return messages[type] || 'nova atividade'
  }

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'share':
        return <Share className="h-4 w-4 text-green-500" />
      case 'friend_request':
        return <UserPlus className="h-4 w-4 text-purple-500" />
      case 'friend_request_accepted':
        return <Check className="h-4 w-4 text-green-500" />
      case 'mention':
        return <Bell className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const markAsRead = (notificationId: string) => {
    if (!user) return

    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    )
    setNotifications(updated)
    setUnreadCount(updated.filter(n => !n.read).length)
    localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated))
  }

  const markAllAsRead = () => {
    if (!user) return

    const updated = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updated)
    setUnreadCount(0)
    localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated))
    toast.success('Todas as notificações foram marcadas como lidas')
  }

  const deleteNotification = (notificationId: string) => {
    if (!user) return

    const updated = notifications.filter(n => n.id !== notificationId)
    setNotifications(updated)
    setUnreadCount(updated.filter(n => !n.read).length)
    localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated))
    toast.success('Notificação removida')
  }

  const clearAllNotifications = () => {
    if (!user) return

    setNotifications([])
    setUnreadCount(0)
    localStorage.setItem(`notifications_${user.id}`, JSON.stringify([]))
    toast.success('Todas as notificações foram removidas')
  }

  if (!user) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="group text-white hover:bg-white/30 w-10 h-10 p-0 rounded-full flex items-center justify-center transition-all duration-200 relative z-10 cursor-pointer transform hover:scale-105 hover:shadow-md"
          title="Notificações"
        >
          <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-red-500 border-2 border-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-96 max-h-96" 
        align="end" 
        sideOffset={5}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          <div className="flex space-x-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-6 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar todas lidas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm mb-1">Nenhuma notificação</p>
              <p className="text-xs">Quando alguém curtir ou comentar seus posts, você verá aqui!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    !notification.read 
                      ? 'bg-purple-50 border-l-2 border-purple-400' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex space-x-3 w-full">
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage 
                        src={notification.from_user.photo_url || undefined} 
                        alt={notification.from_user.display_name} 
                      />
                      <AvatarFallback className="bg-purple-500 text-white text-xs">
                        {notification.from_user.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {getNotificationIcon(notification.type)}
                            <p className="text-sm font-medium text-gray-800 truncate">
                              <span className="font-semibold">
                                {notification.from_user.display_name}
                              </span>{' '}
                              {notification.message}
                            </p>
                          </div>
                          
                          {notification.post && (
                            <p className="text-xs text-gray-600 italic truncate">
                              "{notification.post.content.substring(0, 50)}..."
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações de Notificação
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
