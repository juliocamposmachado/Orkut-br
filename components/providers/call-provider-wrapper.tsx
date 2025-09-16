"use client"

import { useAuth } from '@/contexts/auth-context'
import { CallProvider } from '@/contexts/CallContext'
import { ReactNode } from 'react'

interface CallProviderWrapperProps {
  children: ReactNode
}

export function CallProviderWrapper({ children }: CallProviderWrapperProps) {
  const { user } = useAuth()
  
  // Se não há usuário logado, renderizar children sem CallProvider
  if (!user?.id) {
    return <>{children}</>
  }
  
  // Se há usuário, renderizar com CallProvider
  return (
    <CallProvider currentUserId={user.id}>
      {children}
    </CallProvider>
  )
}
