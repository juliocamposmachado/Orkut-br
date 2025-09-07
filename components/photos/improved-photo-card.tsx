'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { ImageFallback } from '@/components/ui/image-fallback'
import { cn } from '@/lib/utils'

interface ImprovedPhotoCardProps {
  id: string
  src: string
  title?: string
  description?: string
  className?: string
  onClick?: () => void
}

// Generate a better fallback URL from various sources
const generateFallbackUrl = (originalUrl: string): string => {
  try {
    // For Pexels images, try different sizes
    if (originalUrl.includes('pexels.com')) {
      const pexelsUrl = new URL(originalUrl)
      pexelsUrl.searchParams.set('auto', 'compress')
      pexelsUrl.searchParams.set('cs', 'tinysrgb')
      pexelsUrl.searchParams.set('w', '800')
      return pexelsUrl.toString()
    }
    
    // For Google images, try different parameters
    if (originalUrl.includes('googleusercontent.com')) {
      if (originalUrl.includes('=s')) {
        return originalUrl.replace(/=s\d+(-c)?$/, '=s800-c')
      }
      return `${originalUrl}=s800-c`
    }
    
    return originalUrl
  } catch {
    return originalUrl
  }
}

// Generate a simple data URL placeholder
const generateDataPlaceholder = (id: string, title?: string): string => {
  const text = title?.substring(0, 2).toUpperCase() || id.substring(0, 2).toUpperCase()
  const colors = [
    { bg: '#e879f9', text: '#ffffff' }, // purple
    { bg: '#60a5fa', text: '#ffffff' }, // blue
    { bg: '#34d399', text: '#ffffff' }, // green
    { bg: '#fbbf24', text: '#ffffff' }, // yellow
    { bg: '#f87171', text: '#ffffff' }  // red
  ]
  const color = colors[id.length % colors.length]
  
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color.bg}"/>
      <text x="50%" y="50%" font-family="system-ui, sans-serif" font-size="48" font-weight="600" fill="${color.text}" text-anchor="middle" dy=".1em">${text}</text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export function ImprovedPhotoCard({ 
  id, 
  src, 
  title, 
  description, 
  className, 
  onClick 
}: ImprovedPhotoCardProps) {
  const [loadAttempts, setLoadAttempts] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  
  const fallbackSrc = useMemo(() => generateFallbackUrl(src), [src])
  const placeholderSrc = useMemo(() => generateDataPlaceholder(id, title), [id, title])
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])
  
  const handleError = useCallback((error: string) => {
    setLoadAttempts(prev => prev + 1)
    console.warn(`Erro ao carregar foto ${id}:`, error, `(tentativa ${loadAttempts + 1})`)
  }, [id, loadAttempts])
  
  // Reset load attempts when src changes
  useEffect(() => {
    setLoadAttempts(0)
    setIsLoaded(false)
  }, [src])
  
  return (
    <figure 
      className={cn(
        "relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer group",
        "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <ImageFallback
        src={src}
        alt={title || `Foto ${id}`}
        fallbackSrc={loadAttempts > 0 ? placeholderSrc : fallbackSrc}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
        className={cn(
          "object-cover transition-all duration-300",
          "group-hover:scale-105",
          isLoaded ? "opacity-100" : "opacity-80"
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* Overlay with title */}
      {title && (
        <figcaption className={cn(
          "absolute bottom-0 left-0 right-0",
          "bg-gradient-to-t from-black/60 via-black/30 to-transparent",
          "text-white text-sm px-3 py-2",
          "transition-opacity duration-300",
          "group-hover:opacity-100"
        )}>
          <p className="font-medium line-clamp-1">{title}</p>
          {description && (
            <p className="text-xs opacity-90 line-clamp-1">{description}</p>
          )}
        </figcaption>
      )}
      
      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </figure>
  )
}
