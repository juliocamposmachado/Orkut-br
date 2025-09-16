'use client'

// Força renderização dinâmica para todas as páginas que usam este layout
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { ReactNode, Suspense } from 'react'
import { useAuth } from '@/contexts/auth-context'

interface AuthLayoutProps {
  children: ReactNode
}

function AuthContent({ children }: AuthLayoutProps) {
  const { loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    }>
      <AuthContent>{children}</AuthContent>
    </Suspense>
  )
}
