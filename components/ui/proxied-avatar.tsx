'use client'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAvatarProxy } from '@/hooks/use-google-image-proxy'
import { cn } from '@/lib/utils'

interface ProxiedAvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  size?: number
  className?: string
}

export function ProxiedAvatar({ 
  src, 
  alt = 'Avatar', 
  fallback, 
  size = 96, 
  className 
}: ProxiedAvatarProps) {
  const proxiedSrc = useAvatarProxy(src, size)

  // Generate fallback from alt if not provided
  const defaultFallback = fallback || alt?.charAt(0)?.toUpperCase() || '?'

  return (
    <Avatar className={cn(className)}>
      <AvatarImage 
        src={proxiedSrc} 
        alt={alt}
        onError={(e) => {
          console.warn('🖼️ Erro ao carregar avatar:', proxiedSrc)
          // Remove src to show fallback
          e.currentTarget.src = ''
        }}
      />
      <AvatarFallback className="bg-purple-500 text-white">
        {defaultFallback}
      </AvatarFallback>
    </Avatar>
  )
}
