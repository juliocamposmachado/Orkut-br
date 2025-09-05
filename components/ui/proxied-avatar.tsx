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

  // Detect Edge browser
  const isEdge = typeof window !== 'undefined' && /Edge\/|Edg\//.test(window.navigator.userAgent)

  return (
    <Avatar className={cn(className)}>
      <AvatarImage 
        src={proxiedSrc} 
        alt={alt}
        loading="lazy"
        crossOrigin={proxiedSrc?.includes('http') ? 'anonymous' : undefined}
        onError={(e) => {
          console.warn('🖼️ Erro ao carregar avatar:', proxiedSrc)
          // Remove src to show fallback - Edge compatible
          const target = e.currentTarget as HTMLImageElement
          target.src = ''
          target.style.display = 'none'
          
          // Force show fallback for Edge
          if (isEdge) {
            const fallbackElement = target.nextElementSibling as HTMLElement
            if (fallbackElement) {
              fallbackElement.style.display = 'flex'
              fallbackElement.style.visibility = 'visible'
            }
          }
        }}
        onLoad={(e) => {
          // Ensure image is visible when loaded successfully
          const target = e.currentTarget as HTMLImageElement
          target.style.display = 'block'
          target.style.visibility = 'visible'
        }}
        style={{
          // Edge compatibility styles
          objectFit: 'cover',
          objectPosition: 'center',
          // Fallback for Edge Legacy that doesn't support object-fit
          width: '100%',
          height: '100%',
          ...(isEdge && {
            // Additional Edge-specific styles
            imageRendering: 'auto',
            backfaceVisibility: 'hidden'
          })
        }}
      />
      <AvatarFallback 
        className="bg-purple-500 text-white"
        style={{
          // Ensure fallback is properly styled for Edge
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${Math.max(size / 3, 12)}px`,
          fontWeight: '500',
          ...(isEdge && {
            // Additional Edge compatibility
            msFlexAlign: 'center',
            msFlexPack: 'center'
          })
        }}
      >
        {defaultFallback}
      </AvatarFallback>
    </Avatar>
  )
}
