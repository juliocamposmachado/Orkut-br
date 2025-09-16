'use client'

import { createContext, useContext, useEffect } from 'react'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import { useAuth } from '@/contexts/local-auth-context'

interface NotificationContextType {
  isConnected: boolean
  testRealtimeNotification: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth()
  const { isConnected, testRealtimeNotification } = useRealtimeNotifications()

  // Log de conexão para debugging
  useEffect(() => {
    if (user && isConnected) {
      console.log('🔔 Notification system active for user:', user.email)
    }
  }, [user, isConnected])

  const contextValue: NotificationContextType = {
    isConnected,
    testRealtimeNotification
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider')
  }
  return context
}
