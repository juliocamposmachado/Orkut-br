"use client"

import Image from "next/image"
import React, { useState, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"

interface PhotoCardProps {
  id: string
  src: string
  title?: string
  className?: string
}

// Util: gera uma versão mini para blur usando os parâmetros do Pexels/Imaging (?w=)
const toLowRes = (url: string): string => {
  try {
    const u = new URL(url)
    // se já houver w=, força um valor bem pequeno
    const params = u.searchParams
    params.set("w", "24")
    u.search = params.toString()
    return u.toString()
  } catch {
    return url
  }
}

// Generate a simple placeholder based on id/title
const generatePlaceholder = (id: string, title?: string): string => {
  const text = title?.substring(0, 2) || id.substring(0, 2)
  return `data:image/svg+xml;base64,${btoa(
    `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" font-family="sans-serif" font-size="48" fill="#9ca3af" text-anchor="middle" dy=".3em">${text.toUpperCase()}</text>
    </svg>`
  )}`
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ id, src, title, className }) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const blurSrc = useMemo(() => toLowRes(src), [src])
  const placeholderSrc = useMemo(() => generatePlaceholder(id, title), [id, title])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
    setImageError(false)
  }, [])

  const handleImageError = useCallback(() => {
    console.warn('🖼️ Erro ao carregar foto:', src)
    setImageError(true)
    setImageLoaded(false)
  }, [src])

  return (
    <figure className={cn("relative overflow-hidden rounded-lg bg-gray-100", className)}>
      {!imageError ? (
        <Image
          src={src}
          alt={title || id}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
          placeholder="blur"
          blurDataURL={blurSrc}
          className={cn(
            "object-cover transition-all duration-300 hover:scale-[1.03]",
            imageLoaded ? "opacity-100" : "opacity-80"
          )}
          priority={false}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        // Fallback image when main image fails to load
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
          <div className="text-center">
            <div className="text-4xl text-purple-400 mb-2">📷</div>
            <p className="text-sm text-gray-600">{title || 'Foto'}</p>
          </div>
        </div>
      )}
      
      {title && (
        <figcaption className="absolute bottom-0 left-0 right-0 bg-black/35 text-white text-xs px-2 py-1 line-clamp-1">
          {title}
        </figcaption>
      )}
    </figure>
  )
}

