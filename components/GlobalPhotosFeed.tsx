'use client'

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { 
  Heart,
  MessageCircle, 
  Share2,
  Eye,
  ExternalLink,
  Calendar,
  User,
  Search,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Camera,
  Hash,
  Copy,
  SortAsc,
  SortDesc,
  TrendingUp,
  Clock
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import PhotosSkeleton from './PhotosSkeleton'
import RichLinkPreview from './RichLinkPreview'

interface PhotoFeedItem {
  id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  imgur_id: string
  imgur_url: string
  imgur_page_url: string
  width: number
  height: number
  file_size: number
  original_filename: string
  title: string
  description: string | null
  tags: string[]
  likes_count: number
  comments_count: number
  shares_count: number
  views_count: number
  created_at: string
  updated_at: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

interface FeedResponse {
  success: boolean
  data: {
    photos: PhotoFeedItem[]
    pagination: PaginationInfo
    sort: string
    processing_time_ms: number
  }
  error?: string
}

type ViewMode = 'grid' | 'list' | 'rich'
type SortMode = 'recent' | 'popular' | 'oldest'

interface GlobalPhotosFeedProps {
  className?: string
  showHeader?: boolean
  itemsPerPage?: number
  autoRefresh?: boolean // Auto-atualizar quando houver mudanças
  refreshInterval?: number // Intervalo em ms para auto-refresh
}

export interface GlobalPhotosFeedRef {
  refresh: () => Promise<void>
  refreshToFirst: () => Promise<void>
}

const GlobalPhotosFeed = forwardRef<GlobalPhotosFeedRef, GlobalPhotosFeedProps>(({ 
  className = '', 
  showHeader = true,
  itemsPerPage = 12,
  autoRefresh = false,
  refreshInterval = 30000
}, ref) => {
  const [photos, setPhotos] = useState<PhotoFeedItem[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()

  const fetchPhotos = async (page: number = 1, sort: SortMode = 'recent') => {
    setIsLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        sort: sort
      })

      const response = await fetch(`/api/photos/feed?${params}`)
      const result: FeedResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar fotos')
      }

      setPhotos(result.data.photos)
      setPagination(result.data.pagination)
      setCurrentPage(page)

      console.log(`📸 Feed carregado: ${result.data.photos.length} fotos em ${result.data.processing_time_ms}ms`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('❌ Erro ao carregar feed:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && pagination && newPage <= pagination.total_pages) {
      fetchPhotos(newPage, sortMode)
    }
  }

  const handleSortChange = (newSort: SortMode) => {
    setSortMode(newSort)
    fetchPhotos(1, newSort) // Reset to page 1 when sorting
  }

  const incrementView = async (photoId: string) => {
    try {
      await fetch('/api/photos/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photoId })
      })
    } catch (error) {
      console.error('Erro ao incrementar view:', error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Agora mesmo'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dias atrás`
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const copyImageUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      console.log('📋 URL copiada:', url)
    } catch (error) {
      console.error('Erro ao copiar URL:', error)
    }
  }

  const filteredPhotos = photos.filter(photo => 
    searchQuery === '' || 
    photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    photo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    photo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Expor funções via ref
  useImperativeHandle(ref, () => ({
    refresh: async () => {
      console.log('🔄 [Feed] Refresh solicitado externamente')
      await fetchPhotos(currentPage, sortMode)
    },
    refreshToFirst: async () => {
      console.log('🔄 [Feed] Refresh para primeira página solicitado externamente')
      // Forçar ordenação "recent" para mostrar as fotos mais novas primeiro
      setSortMode('recent')
      await fetchPhotos(1, 'recent')
    }
  }), [currentPage, sortMode, fetchPhotos])

  useEffect(() => {
    fetchPhotos(1, sortMode)
  }, [])

  // Auto-refresh se habilitado
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return

    console.log(`🔄 [Feed] Auto-refresh configurado: ${refreshInterval}ms`)
    const interval = setInterval(() => {
      console.log('🔄 [Feed] Auto-refresh executado')
      fetchPhotos(currentPage, sortMode)
    }, refreshInterval)

    return () => {
      console.log('🔄 [Feed] Auto-refresh limpo')
      clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, currentPage, sortMode])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Feed Global de Fotos</h2>
              <p className="text-sm text-gray-600">
                {pagination ? `${pagination.total} fotos compartilhadas` : 'Carregando...'}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar fotos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white rounded-lg p-4 border">
        {/* Sort Options */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Ordenar:</span>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant={sortMode === 'recent' ? 'default' : 'outline'}
              onClick={() => handleSortChange('recent')}
              className="text-xs"
            >
              <Clock className="w-3 h-3 mr-1" />
              Recentes
            </Button>
            <Button
              size="sm"
              variant={sortMode === 'popular' ? 'default' : 'outline'}
              onClick={() => handleSortChange('popular')}
              className="text-xs"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Populares
            </Button>
            <Button
              size="sm"
              variant={sortMode === 'oldest' ? 'default' : 'outline'}
              onClick={() => handleSortChange('oldest')}
              className="text-xs"
            >
              <Calendar className="w-3 h-3 mr-1" />
              Antigas
            </Button>
          </div>
        </div>

        {/* View Mode */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Exibir:</span>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              className="text-xs"
            >
              <Grid3X3 className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="text-xs"
            >
              <List className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'rich' ? 'default' : 'outline'}
              onClick={() => setViewMode('rich')}
              className="text-xs"
            >
              📝 Rich
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State with Skeleton */}
      {isLoading && (
        <PhotosSkeleton 
          count={itemsPerPage} 
          viewMode={viewMode} 
        />
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar fotos</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchPhotos(currentPage, sortMode)} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredPhotos.length === 0 && (
        <div className="text-center py-12">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {searchQuery ? 'Nenhuma foto encontrada' : 'Feed vazio'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery 
              ? 'Tente buscar por outros termos'
              : 'Seja o primeiro a compartilhar uma foto!'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Limpar Busca
              </Button>
            )}
            {!searchQuery && pagination?.total === 0 && (
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/photos/seed-examples', {
                      method: 'POST'
                    })
                    const result = await response.json()
                    if (result.success) {
                      console.log('✅ Fotos de exemplo adicionadas:', result.data)
                      fetchPhotos(1, sortMode) // Recarregar feed
                    }
                  } catch (error) {
                    console.error('❌ Erro ao adicionar fotos de exemplo:', error)
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                🎨 Adicionar Fotos de Exemplo
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Photos Grid/List/Rich */}
      {!isLoading && !error && filteredPhotos.length > 0 && (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
            : viewMode === 'rich'
            ? 'grid grid-cols-1 lg:grid-cols-2 gap-6'
            : 'space-y-6'
        }>
          {filteredPhotos.map((photo) => {
            // Modo Rich - usa RichLinkPreview
            if (viewMode === 'rich') {
              return (
                <div key={photo.id} className="space-y-4">
                  {/* User Info */}
                  <div className="flex items-center space-x-2 px-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                      {photo.user_avatar ? (
                        <Image src={photo.user_avatar} alt={photo.user_name} width={32} height={32} className="rounded-full" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{photo.user_name}</p>
                      <p className="text-xs text-gray-500">{formatDate(photo.created_at)}</p>
                    </div>
                  </div>
                  
                  {/* Rich Link Preview */}
                  <RichLinkPreview
                    url={photo.imgur_url}
                    onClick={() => {
                      incrementView(photo.id)
                      window.open(photo.imgur_page_url, '_blank')
                    }}
                  />
                  
                  {/* Tags */}
                  {photo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-2">
                      {photo.tags.slice(0, 4).map((tag, index) => (
                        <span key={index} className="inline-flex items-center text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full">
                          <Hash className="w-2 h-2 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {photo.tags.length > 4 && (
                        <span className="text-xs text-gray-400">+{photo.tags.length - 4}</span>
                      )}
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between px-2 pt-2 border-t">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{photo.likes_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{photo.comments_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{photo.views_count}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {photo.width} × {photo.height} • {formatFileSize(photo.file_size)}
                    </div>
                  </div>
                </div>
              )
            }
            
            // Modos Grid e List - renderização original
            return (
            <div 
              key={photo.id} 
              className={`bg-white rounded-lg border hover:shadow-lg transition-all duration-200 ${
                viewMode === 'list' ? 'flex space-x-4 p-4' : 'overflow-hidden'
              }`}
            >
              {/* Image */}
              <div className={`${viewMode === 'list' ? 'w-48 h-36' : 'aspect-square'} relative bg-gray-100 overflow-hidden ${viewMode === 'grid' ? 'rounded-t-lg' : 'rounded-lg flex-shrink-0'}`}>
                <Image
                  src={photo.imgur_url}
                  alt={photo.title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                  sizes={viewMode === 'grid' ? '(max-width: 768px) 50vw, 25vw' : '192px'}
                  onClick={() => {
                    incrementView(photo.id)
                    window.open(photo.imgur_page_url, '_blank')
                  }}
                />
                
                {/* Overlay with stats */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                  <div className="flex space-x-4 text-white text-sm">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{photo.likes_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{photo.views_count}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className={`${viewMode === 'grid' ? 'p-4' : 'flex-1'} space-y-3`}>
                {/* User Info */}
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                    {photo.user_avatar ? (
                      <Image src={photo.user_avatar} alt={photo.user_name} width={24} height={24} className="rounded-full" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{photo.user_name}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{formatDate(photo.created_at)}</span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-gray-800 line-clamp-2" title={photo.title}>
                  {photo.title}
                </h3>

                {/* Description */}
                {photo.description && (
                  <p className="text-sm text-gray-600 line-clamp-2" title={photo.description}>
                    {photo.description}
                  </p>
                )}

                {/* Tags */}
                {photo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {photo.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="inline-flex items-center text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full">
                        <Hash className="w-2 h-2 mr-1" />
                        {tag}
                      </span>
                    ))}
                    {photo.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{photo.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Stats & Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{photo.likes_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{photo.comments_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{photo.views_count}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyImageUrl(photo.imgur_url)}
                      className="text-xs h-7 px-2"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        incrementView(photo.id)
                        window.open(photo.imgur_page_url, '_blank')
                      }}
                      className="text-xs h-7 px-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* File Info */}
                <div className="text-xs text-gray-400 pt-2 border-t">
                  {photo.width} × {photo.height} • {formatFileSize(photo.file_size)}
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && !isLoading && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.has_prev}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(
                pagination.total_pages - 4,
                Math.max(1, currentPage - 2)
              )) + i
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pagination.has_next}
          >
            Próximo
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Footer Info */}
      {pagination && !isLoading && (
        <div className="text-center text-sm text-gray-500">
          Página {pagination.page} de {pagination.total_pages} • {pagination.total} fotos no total
        </div>
      )}
    </div>
  )
})

GlobalPhotosFeed.displayName = 'GlobalPhotosFeed'

export default GlobalPhotosFeed
