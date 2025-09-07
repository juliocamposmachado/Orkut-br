'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ImageFallbackProps {
  src: string
  alt: string
  fallbackSrc?: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  onLoad?: () => void
  onError?: (error: string) => void
}

export function ImageFallback({
  src,
  alt,
  fallbackSrc,
  className,
  fill = false,
  width,
  height,
  sizes,
  priority = false,
  onLoad,
  onError
}: ImageFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Reset states when src changes
  useEffect(() => {
    setCurrentSrc(src)
    setHasError(false)
    setIsLoading(true)
  }, [src])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setIsLoading(false)
    
    if (currentSrc !== fallbackSrc && fallbackSrc) {
      // Try fallback source
      setCurrentSrc(fallbackSrc)
      console.warn('🔄 Tentando imagem de fallback:', fallbackSrc)
    } else {
      // All sources failed
      setHasError(true)
      onError?.('Failed to load image and fallback')
      console.error('❌ Falha ao carregar imagem:', currentSrc)
    }
  }, [currentSrc, fallbackSrc, onError])

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200",
          className
        )}
        style={fill ? undefined : { width, height }}
      >
        <div className="text-center">
          <div className="text-2xl text-gray-400 mb-1">📷</div>
          <p className="text-xs text-gray-500">Imagem não disponível</p>
        </div>
      </div>
    )
  }

  const imageProps = {
    src: currentSrc,
    alt,
    onLoad: handleLoad,
    onError: handleError,
    className: cn(
      "transition-opacity duration-300",
      isLoading ? "opacity-70" : "opacity-100",
      className
    ),
    priority,
    sizes
  }

  if (fill) {
    return <Image {...imageProps} fill />
  }

  return <Image {...imageProps} width={width!} height={height!} />
}
