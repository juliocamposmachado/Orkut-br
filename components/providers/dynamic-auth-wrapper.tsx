'use client'

// Este arquivo força todas as páginas que o importam a usar renderização dinâmica
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { ReactNode, useEffect } from 'react'

interface DynamicAuthWrapperProps {
  children: ReactNode
}

// Componente que força renderização dinâmica para páginas que usam autenticação
export function DynamicAuthWrapper({ children }: DynamicAuthWrapperProps) {
  useEffect(() => {
    // Garantir que estamos no lado cliente
    if (typeof window === 'undefined') return
    
    // Log para debug durante desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [DYNAMIC AUTH WRAPPER] Página renderizada dinamicamente (sem static generation)')
    }
  }, [])

  return <>{children}</>
}
