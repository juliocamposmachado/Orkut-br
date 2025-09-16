'use client'

import { ReactNode } from 'react'

interface SafeAuthWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

// This wrapper prevents build-time errors by checking if we're in browser
export function SafeAuthWrapper({ children, fallback = null }: SafeAuthWrapperProps) {
  // During build time (server-side rendering), don't render auth-dependent content
  if (typeof window === 'undefined') {
    return fallback
  }

  return <>{children}</>
}
