'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Button } from '@/components/ui/button'
import { 
  Camera, 
  Heart, 
  MessageCircle, 
  Eye, 
  ExternalLink, 
  Copy,
  Calendar,
  User,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AlbumPhoto {
  id: string
  user_id: string
  imgur_link: string
  titulo: string
  descricao: string
  likes_count: number
  comments_count: number
  views_count: number
  is_public: boolean
  created_at: string
  updated_at: string
  profiles: {
    username: string
    display_name: string
    photo_url: string
  }
}

interface AlbumPhotosProps {
  userId?: string // Se fornecido, mostra álbum de outro usuário (apenas fotos públicas)
  className?: string
  showHeader?: boolean
  itemsPerPage?: number
  viewMode?: 'grid' | 'list'
}

export default function AlbumPhotos({ 
  userId, 
  className = '',
  showHeader = true,
  itemsPerPage = 12,
  viewMode: initialViewMode = 'grid'
}: AlbumPhotosProps) {
  const { user, session } = useAuth() as any
  const [photos, setPhotos] = useState<AlbumPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPhotos, setTotalPhotos] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)
  const [albumOwner, setAlbumOwner] = useState<any>(null)
  
  const isOwnAlbum = !userId || (user && user.id === userId)

  const fetchPhotos = async (pageNum: number = 1) => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      
      if (userId) {
        params.append('user_id', userId)
      } else if (session?.access_token) {
        params.append('user_token', session.access_token)
      } else {
        setError('É necessário estar logado para ver seu álbum')
        setLoading(false)
        return
      }

      params.append('page', pageNum.toString())
      params.append('limit', itemsPerPage.toString())

      const response = await fetch(`/api/photos/album?${params.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar álbum')
      }

      setPhotos(result.data.photos)
      setPage(result.data.pagination.page)
      setTotalPages(result.data.pagination.total_pages)
      setTotalPhotos(result.data.pagination.total)
      
      // Se tem fotos, usar o primeiro profile como owner
      if (result.data.photos.length > 0) {
        setAlbumOwner(result.data.photos[0].profiles)
      }

      console.log('✅ Álbum carregado:', {
        photos: result.data.photos.length,
        page: pageNum,
        total: result.data.pagination.total
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('❌ Erro ao carregar álbum:', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos(1)
  }, [userId, session, itemsPerPage])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchPhotos(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Link copiado!')
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-purple-500 mx-auto animate-spin mb-4" />
          <p className="text-gray-600">Carregando álbum de fotos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao Carregar Álbum</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button 
            onClick={() => fetchPhotos(page)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      {showHeader && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {isOwnAlbum ? 'Meu Álbum' : `Álbum de ${albumOwner?.display_name || 'Usuário'}`}
                </h2>
                <p className="text-gray-600">
                  {totalPhotos} foto{totalPhotos !== 1 ? 's' : ''} 
                  {!isOwnAlbum && ' pública'}
                  {!isOwnAlbum && totalPhotos !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchPhotos(page)}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Fotos */}
      {photos.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {isOwnAlbum ? 'Seu álbum está vazio' : 'Este álbum está vazio'}
          </h3>
          <p className="text-gray-500">
            {isOwnAlbum 
              ? 'Faça upload de fotos para começar seu álbum!' 
              : 'Este usuário ainda não tem fotos públicas.'
            }
          </p>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {photos.map((photo) => (
                <div key={photo.id} className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={photo.imgur_link}
                      alt={photo.titulo}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-800 truncate text-sm mb-1">
                      {photo.titulo}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center">
                          <Heart className="w-3 h-3 mr-1" />
                          {photo.likes_count}
                        </span>
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {photo.views_count}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => copyToClipboard(photo.imgur_link)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Copiar link"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => window.open(photo.imgur_link, '_blank')}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Abrir original"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-4 mb-6">
              {photos.map((photo) => (
                <div key={photo.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                  <div className="flex space-x-4">
                    <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={photo.imgur_link}
                        alt={photo.titulo}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-1">{photo.titulo}</h3>
                          {photo.descricao && (
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{photo.descricao}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(photo.created_at)}
                            </span>
                            <span className="flex items-center">
                              <Heart className="w-3 h-3 mr-1" />
                              {photo.likes_count} curtidas
                            </span>
                            <span className="flex items-center">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              {photo.comments_count} comentários
                            </span>
                            <span className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {photo.views_count} visualizações
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(photo.imgur_link)}
                            className="text-xs h-8 px-2"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(photo.imgur_link, '_blank')}
                            className="text-xs h-8 px-2"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages, page - 2 + i))
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
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
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Footer com estatísticas */}
      {photos.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
          📸 {totalPhotos} foto{totalPhotos !== 1 ? 's' : ''} •
          Página {page} de {totalPages}
          {!isOwnAlbum && albumOwner && (
            <span className="ml-2">
              • Álbum de <strong>{albumOwner.display_name}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
