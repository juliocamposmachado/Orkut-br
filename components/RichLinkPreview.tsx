'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  ExternalLink, 
  Image as ImageIcon, 
  Calendar, 
  User,
  Heart,
  Eye,
  Hash,
  Copy,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LinkMetadata {
  url: string
  title?: string
  description?: string
  image?: string
  site_name?: string
  width?: number
  height?: number
  type?: string
}

interface RichLinkPreviewProps {
  url: string
  className?: string
  compact?: boolean
  showActions?: boolean
  onClick?: () => void
}

// URLs de imagem conhecidas e seus padrões
const IMAGE_HOSTS = {
  imgur: {
    pattern: /imgur\.com\/([a-zA-Z0-9]+)/,
    directUrl: (id: string) => `https://i.imgur.com/${id}.jpg`,
    pageUrl: (id: string) => `https://imgur.com/${id}`,
    siteName: 'Imgur'
  },
  'i.imgur': {
    pattern: /i\.imgur\.com\/([a-zA-Z0-9]+)\.(jpg|jpeg|png|gif|webp)/,
    directUrl: (match: string) => `https://i.imgur.com/${match}`,
    siteName: 'Imgur'
  },
  postimage: {
    pattern: /postimage\.io\/([a-zA-Z0-9]+)/,
    siteName: 'PostImage'
  },
  generic: {
    pattern: /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i,
    siteName: 'Image'
  }
}

export default function RichLinkPreview({ 
  url, 
  className = '', 
  compact = false, 
  showActions = true,
  onClick 
}: RichLinkPreviewProps) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [imageError, setImageError] = useState(false)

  const detectImageHost = (url: string) => {
    for (const [host, config] of Object.entries(IMAGE_HOSTS)) {
      if (config.pattern.test(url)) {
        return { host, config }
      }
    }
    return null
  }

  const extractMetadata = async (url: string): Promise<LinkMetadata> => {
    const detected = detectImageHost(url)
    
    if (detected) {
      const { host, config } = detected
      
      // Para URLs do Imgur, extrair ID e gerar metadata
      if (host === 'imgur') {
        const match = url.match(config.pattern)
        if (match) {
          const imgurId = match[1]
          return {
            url,
            title: `Imagem ${imgurId} - Imgur`,
            description: 'Imagem hospedada no Imgur',
            image: config.directUrl!(imgurId),
            site_name: config.siteName,
            type: 'image'
          }
        }
      }
      
      // Para URLs diretas de imagem do Imgur
      if (host === 'i.imgur') {
        const match = url.match(config.pattern)
        if (match) {
          const filename = match[1]
          const extension = match[2]
          return {
            url,
            title: `${filename}.${extension}`,
            description: 'Imagem direta do Imgur',
            image: url,
            site_name: config.siteName,
            type: 'image'
          }
        }
      }
      
      // Para outras URLs de imagem
      return {
        url,
        title: url.split('/').pop() || 'Imagem',
        description: 'Arquivo de imagem',
        image: url,
        site_name: config.siteName,
        type: 'image'
      }
    }
    
    // Se não for uma URL de imagem conhecida, retornar dados básicos
    return {
      url,
      title: url,
      description: 'Link externo',
      type: 'link'
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      console.log('📋 URL copiada:', text)
    } catch (error) {
      console.error('Erro ao copiar URL:', error)
    }
  }

  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoading(true)
      setError('')
      
      try {
        const meta = await extractMetadata(url)
        setMetadata(meta)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        setError(errorMessage)
        console.error('Erro ao extrair metadata:', errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadMetadata()
  }, [url])

  if (isLoading) {
    return (
      <div className={cn(
        "bg-white border rounded-lg p-4 animate-pulse",
        compact ? "flex items-center space-x-3" : "space-y-3",
        className
      )}>
        <div className={cn(
          "bg-gray-200 rounded",
          compact ? "w-16 h-16 flex-shrink-0" : "w-full h-48"
        )} />
        <div className={compact ? "flex-1 space-y-2" : "space-y-2"}>
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (error || !metadata) {
    return (
      <div className={cn(
        "bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3",
        className
      )}>
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-800">Erro ao carregar preview</p>
          <p className="text-xs text-red-600">{error || 'Dados não disponíveis'}</p>
        </div>
      </div>
    )
  }

  const hasImage = metadata.image && !imageError
  const isImageType = metadata.type === 'image'

  return (
    <div 
      className={cn(
        "bg-white border rounded-lg hover:shadow-md transition-all duration-200 overflow-hidden",
        compact ? "flex" : "",
        onClick && "cursor-pointer hover:border-purple-300",
        className
      )}
      onClick={onClick}
    >
      {/* Image/Thumbnail */}
      {hasImage && (
        <div className={cn(
          "relative bg-gray-100 overflow-hidden flex-shrink-0",
          compact ? "w-20 h-20" : "w-full h-48"
        )}>
          <Image
            src={metadata.image}
            alt={metadata.title || 'Preview'}
            fill
            className="object-cover"
            sizes={compact ? "80px" : "(max-width: 768px) 100vw, 50vw"}
            onError={() => setImageError(true)}
          />
          
          {/* Overlay para tipo imagem */}
          {isImageType && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "flex-1",
        compact ? "p-3" : "p-4",
        hasImage && compact ? "min-w-0" : ""
      )}>
        {/* Site name */}
        {metadata.site_name && (
          <div className="flex items-center space-x-1 mb-1">
            <span className="text-xs text-gray-500 font-medium">
              {metadata.site_name}
            </span>
            {isImageType && (
              <ImageIcon className="w-3 h-3 text-gray-400" />
            )}
          </div>
        )}

        {/* Title */}
        <h3 className={cn(
          "font-semibold text-gray-800 line-clamp-2",
          compact ? "text-sm" : "text-base",
          hasImage && compact ? "truncate" : ""
        )}>
          {metadata.title}
        </h3>

        {/* Description */}
        {metadata.description && !compact && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
            {metadata.description}
          </p>
        )}

        {/* URL */}
        <div className="flex items-center space-x-1 mt-2">
          <span className={cn(
            "text-gray-400 truncate",
            compact ? "text-xs" : "text-sm"
          )}>
            {new URL(metadata.url).hostname}
          </span>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              {metadata.width && metadata.height && (
                <span className="text-xs text-gray-500">
                  {metadata.width} × {metadata.height}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  copyToClipboard(metadata.url)
                }}
                className="text-xs h-6 px-2"
              >
                <Copy className="w-3 h-3" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(metadata.url, '_blank')
                }}
                className="text-xs h-6 px-2"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook para usar em textos com URLs
export function useRichTextWithPreviews(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urls = text.match(urlRegex) || []
  
  return {
    urls,
    hasUrls: urls.length > 0,
    textWithoutUrls: text.replace(urlRegex, '').trim()
  }
}
