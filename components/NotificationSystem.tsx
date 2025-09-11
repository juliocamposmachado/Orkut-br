'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  Loader2,
  Upload,
  Database,
  Wifi,
  WifiOff,
  Sync,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning' | 'loading' | 'sync'
  title: string
  description?: string
  duration?: number | null // null = persistent
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  progress?: number // 0-100 for loading notifications
  metadata?: {
    photoTitle?: string
    photoId?: string
    syncStatus?: 'optimistic' | 'syncing' | 'synced' | 'error'
  }
}

interface NotificationContextValue {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => string
  removeNotification: (id: string) => void
  updateNotification: (id: string, updates: Partial<Notification>) => void
  clearAll: () => void
  
  // Funções especializadas
  notifyPhotoUpload: (photoTitle: string, photoId?: string) => string
  notifyPhotoSync: (photoTitle: string, photoId?: string) => string
  notifyPhotoSynced: (photoTitle: string, photoId?: string) => string
  notifyPhotoError: (photoTitle: string, error: string, photoId?: string) => string
  notifyConnectionStatus: (isOnline: boolean) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
  maxNotifications?: number
}

export function NotificationProvider({ children, maxNotifications = 5 }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>): string => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? (notification.persistent ? null : 5000)
    }

    setNotifications(prev => {
      const updated = [newNotification, ...prev]
      // Limitar o número de notificações
      if (updated.length > maxNotifications) {
        return updated.slice(0, maxNotifications)
      }
      return updated
    })

    // Auto-remover se tiver duração definida
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    console.log('🔔 [Notification] Adicionada:', { id, type: notification.type, title: notification.title })
    return id
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    console.log('🔔 [Notification] Removida:', id)
  }

  const updateNotification = (id: string, updates: Partial<Notification>) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, ...updates } : n
    ))
    console.log('🔔 [Notification] Atualizada:', { id, updates })
  }

  const clearAll = () => {
    setNotifications([])
    console.log('🔔 [Notification] Todas removidas')
  }

  // Funções especializadas para fotos
  const notifyPhotoUpload = (photoTitle: string, photoId?: string): string => {
    return addNotification({
      type: 'loading',
      title: 'Upload em progresso',
      description: `Enviando "${photoTitle}" para o Imgur...`,
      persistent: true,
      progress: 0,
      metadata: { photoTitle, photoId, syncStatus: 'optimistic' }
    })
  }

  const notifyPhotoSync = (photoTitle: string, photoId?: string): string => {
    return addNotification({
      type: 'sync',
      title: 'Sincronizando com banco de dados',
      description: `Salvando "${photoTitle}" no Orkut...`,
      persistent: true,
      metadata: { photoTitle, photoId, syncStatus: 'syncing' }
    })
  }

  const notifyPhotoSynced = (photoTitle: string, photoId?: string): string => {
    return addNotification({
      type: 'success',
      title: 'Foto salva com sucesso!',
      description: `"${photoTitle}" foi adicionada ao Feed Global.`,
      duration: 4000,
      metadata: { photoTitle, photoId, syncStatus: 'synced' }
    })
  }

  const notifyPhotoError = (photoTitle: string, error: string, photoId?: string): string => {
    return addNotification({
      type: 'error',
      title: 'Erro ao sincronizar foto',
      description: `"${photoTitle}": ${error}`,
      persistent: true,
      action: {
        label: 'Tentar novamente',
        onClick: () => {
          // Esta função será sobrescrita pelo componente que usa a notificação
          console.log('🔄 Retry solicitado para:', photoId)
        }
      },
      metadata: { photoTitle, photoId, syncStatus: 'error' }
    })
  }

  const notifyConnectionStatus = (isOnline: boolean) => {
    if (!isOnline) {
      addNotification({
        type: 'warning',
        title: 'Sem conexão com a internet',
        description: 'As fotos serão sincronizadas quando a conexão for restaurada.',
        persistent: true
      })
    } else {
      // Remover notificação de offline se existir
      setNotifications(prev => prev.filter(n => 
        !(n.type === 'warning' && n.title.includes('Sem conexão'))
      ))
      
      addNotification({
        type: 'success',
        title: 'Conexão restaurada',
        description: 'Sincronizando fotos pendentes...',
        duration: 3000
      })
    }
  }

  const value: NotificationContextValue = {
    notifications,
    addNotification,
    removeNotification,
    updateNotification,
    clearAll,
    notifyPhotoUpload,
    notifyPhotoSync,
    notifyPhotoSynced,
    notifyPhotoError,
    notifyConnectionStatus
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

// Componente de renderização das notificações
function NotificationContainer() {
  const { notifications, removeNotification, updateNotification } = useNotifications()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] space-y-2 w-96">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
          onUpdate={(updates) => updateNotification(notification.id, updates)}
        />
      ))}
    </div>,
    document.body
  )
}

interface NotificationCardProps {
  notification: Notification
  onRemove: () => void
  onUpdate: (updates: Partial<Notification>) => void
}

function NotificationCard({ notification, onRemove, onUpdate }: NotificationCardProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
      case 'loading':
        return <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
      case 'sync':
        return <Sync className="w-5 h-5 text-blue-500 animate-pulse" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      case 'loading':
        return 'bg-purple-50 border-purple-200'
      case 'sync':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border shadow-lg p-4 relative transition-all duration-300 ease-in-out",
        "animate-in slide-in-from-right-full",
        getBgColor()
      )}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        onClick={onRemove}
      >
        <X className="w-3 h-3" />
      </Button>

      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 pr-6">
          <h4 className="text-sm font-semibold text-gray-900">
            {notification.title}
          </h4>
          
          {notification.description && (
            <p className="text-sm text-gray-600 mt-1">
              {notification.description}
            </p>
          )}

          {/* Progress bar for loading notifications */}
          {notification.type === 'loading' && typeof notification.progress === 'number' && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${notification.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(notification.progress)}%
              </p>
            </div>
          )}

          {/* Action button */}
          {notification.action && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={notification.action.onClick}
                className="text-xs h-7"
              >
                {notification.action.label}
              </Button>
            </div>
          )}

          {/* Metadata for photo notifications */}
          {notification.metadata?.syncStatus && (
            <div className="flex items-center space-x-2 mt-2">
              <div className="flex items-center space-x-1">
                {notification.metadata.syncStatus === 'optimistic' && (
                  <>
                    <Upload className="w-3 h-3 text-purple-500" />
                    <span className="text-xs text-purple-600">Local</span>
                  </>
                )}
                {notification.metadata.syncStatus === 'syncing' && (
                  <>
                    <Database className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-blue-600">Sincronizando...</span>
                  </>
                )}
                {notification.metadata.syncStatus === 'synced' && (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-600">Sincronizada</span>
                  </>
                )}
                {notification.metadata.syncStatus === 'error' && (
                  <>
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-red-600">Falha</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
