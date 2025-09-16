'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { usePhotos, Photo } from '@/hooks/use-photos'
import { Button } from '@/components/ui/button'
import { ImprovedPhotoCard } from '@/components/photos/improved-photo-card'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, 
  Upload, 
  RefreshCw, 
  AlertCircle,
  Loader2,
  FolderOpen,
  Image as ImageIcon,
  Heart,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserPhotosGalleryProps {
  className?: string
  onPhotoClick?: (photo: Photo) => void
}

export function UserPhotosGallery({ className, onPhotoClick }: UserPhotosGalleryProps) {
  const { user, profile } = useAuth()
  
  // Usar apenas fotos do usuário atual
  const { 
    photos, 
    loading, 
    error, 
    stats, 
    refreshPhotos, 
    likePhoto, 
    incrementViews
  } = usePhotos({
    userId: user?.id,
    publicOnly: false, // Mostrar fotos públicas e privadas do usuário
    limit: 50
  })

  const handlePhotoClick = useCallback(async (photo: Photo) => {
    // Incrementar visualizações
    await incrementViews(photo.id)
    // Chamar callback se fornecido
    onPhotoClick?.(photo)
  }, [incrementViews, onPhotoClick])

  const handleLikePhoto = useCallback(async (photoId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Evitar abrir a foto
    await likePhoto(photoId)
  }, [likePhoto])

  if (!user) {
    return (
      <OrkutCard className={className}>
        <OrkutCardContent className="p-6 text-center">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Login Necessário</h3>
          <p className="text-gray-600">Faça login para ver suas fotos</p>
        </OrkutCardContent>
      </OrkutCard>
    )
  }

  return (
    <OrkutCard className={className}>
      <OrkutCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-medium">Minhas Fotos</h3>
            <Badge variant="secondary" className="text-xs">
              {photos.length} foto{photos.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPhotos}
              disabled={loading}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              Atualizar
            </Button>
          </div>
        </div>
      </OrkutCardHeader>
      
      <OrkutCardContent>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Carregando suas fotos...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h4 className="font-medium text-red-800">Erro ao carregar fotos</h4>
            </div>
            <p className="text-red-600 mt-1 text-sm">{error}</p>
            <div className="mt-3">
              <Button size="sm" variant="outline" onClick={refreshPhotos}>
                Tentar novamente
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && photos.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma foto encontrada
            </h4>
            <p className="text-gray-600 mb-6">
              Faça upload de suas primeiras fotos para começar sua galeria pessoal
            </p>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              onClick={() => {
                // Redirecionar para a página de upload ou abrir modal de upload
                window.location.href = '/fotos?upload=true'
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Fazer Upload de Fotos
            </Button>
          </div>
        )}

        {!loading && !error && photos.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <ImprovedPhotoCard
                    id={photo.id}
                    src={photo.thumbnail_url || photo.url}
                    title={photo.title}
                    description={photo.description || `Criada: ${new Date(photo.created_at).toLocaleDateString('pt-BR')}`}
                    className="aspect-square cursor-pointer"
                    onClick={() => handlePhotoClick(photo)}
                  />
                  
                  {/* Overlay com estatísticas */}
                  <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleLikePhoto(photo.id, e)}
                      className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm hover:bg-white transition-colors"
                      title="Curtir foto"
                    >
                      <Heart className="w-4 h-4 text-red-500" fill={photo.likes_count > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  
                  {/* Stats na parte inferior */}
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between text-white text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{photo.likes_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{photo.views_count}</span>
                        </div>
                      </div>
                      {photo.category && (
                        <Badge variant="secondary" className="text-xs py-0 px-1 h-4">
                          {photo.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Estatísticas da galeria */}
            {stats && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <p className="text-xs text-gray-600">Fotos Total</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.public}</div>
                    <p className="text-xs text-gray-600">Fotos Públicas</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{stats.private}</div>
                    <p className="text-xs text-gray-600">Fotos Privadas</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs text-gray-600 text-center">
                    📸 Suas fotos são armazenadas com segurança e podem ser compartilhadas com seus amigos
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </OrkutCardContent>
    </OrkutCard>
  )
}
