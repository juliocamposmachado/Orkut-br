'use client'

import { useState, useCallback } from 'react'
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
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const proxiedSrc = useAvatarProxy(src, size)

  // Generate fallback from alt if not provided
  const defaultFallback = fallback || alt?.charAt(0)?.toUpperCase() || '?'

  // Reset error state when src changes
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
    setImageError(false)
  }, [])

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.warn('🖼️ Erro ao carregar avatar:', proxiedSrc)
    setImageError(true)
    setImageLoaded(false)
    
    // Hide the failed image
    const target = e.currentTarget as HTMLImageElement
    target.style.display = 'none'
  }, [proxiedSrc])

  // Don't render AvatarImage if we had an error or no src
  const shouldShowImage = proxiedSrc && !imageError

  return (
    <Avatar className={cn(className)}>
      {shouldShowImage && (
        <AvatarImage 
          src={proxiedSrc} 
          alt={alt}
          loading="lazy"
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            width: '100%',
            height: '100%',
            transition: 'opacity 0.2s ease-in-out',
            opacity: imageLoaded ? 1 : 0.8
          }}
        />
      )}
      <AvatarFallback 
        className="bg-purple-500 text-white"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${Math.max(size / 3, 12)}px`,
          fontWeight: '500',
          // Show fallback if no image or error
          opacity: (!shouldShowImage || !imageLoaded) ? 1 : 0
        }}
      >
        {defaultFallback}
      </AvatarFallback>
    </Avatar>
  )
}
