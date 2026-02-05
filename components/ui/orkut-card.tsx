import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface OrkutCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'gradient' | 'community'
}

export function OrkutCard({ children, className, variant = 'default' }: OrkutCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-md border border-purple-200 overflow-hidden",
        {
          'bg-gradient-to-br from-purple-50 to-pink-50': variant === 'gradient',
          'bg-gradient-to-r from-purple-100 to-pink-100': variant === 'community',
        },
        className
      )}
    >
      {children}
    </div>
  )
}

export function OrkutCardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold", className)}>
      {children}
    </div>
  )
}

export function OrkutCardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("p-4", className)}>
      {children}
    </div>
  )
}

export function OrkutCardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("px-4 py-3 bg-gray-50 border-t border-purple-100", className)}>
      {children}
    </div>
  )
}