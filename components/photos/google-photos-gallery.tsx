'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { Button } from '@/components/ui/button'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Camera,
  Filter,
  Search,
  Grid3x3,
  List,
  Eye,
  Heart,
  MessageCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGooglePhotosLinks, type GooglePhotoLink } from '@/hooks/use-google-photos-links'

interface GooglePhotosGalleryProps {
  className?: string
  showUserPhotos?: boolean
  showPublicPhotos?: boolean
  onPhotoClick?: (photo: GooglePhotoLink) => void
  viewMode?: 'grid' | 'list'
  showSearch?: boolean
  maxPhotos?: number
}

export function GooglePhotosGallery({
  className,
  showUserPhotos = true,
  showPublicPhotos = true,
  onPhotoClick,
  viewMode: initialViewMode = 'grid',
  showSearch = true,
  maxPhotos = 50
}: GooglePhotosGalleryProps) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [viewMode, setViewMode] = useState(initialViewMode)

  // Hook para fotos do usuário
  const {
    links: userPhotos,
    loading: userLoading,
    error: userError,
    refresh: refreshUser,
    stats: userStats
  } = useGooglePhotosLinks({ 
    autoFetch: showUserPhotos && !!user,
    limit: maxPhotos 
  })

  // Hook para fotos públicas
  const {
    links: publicPhotos,
    loading: publicLoading,
    error: publicError,
    refresh: refreshPublic,
    stats: publicStats
  } = useGooglePhotosLinks({ 
    publicOnly: true,
    autoFetch: showPublicPhotos,
    limit: maxPhotos * 2 
  })

  // Combinar fotos com filtros
  const allPhotos = [
    ...(showUserPhotos ? userPhotos : []),
    ...(showPublicPhotos ? publicPhotos.filter(p => !showUserPhotos || p.user_id !== user?.id) : [])
  ]

  // Aplicar filtros
  const filteredPhotos = allPhotos.filter(photo => {
    const matchesSearch = !searchQuery || 
      photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (photo.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (photo.user_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = !selectedCategory || photo.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Categorias disponíveis
  const availableCategories = Array.from(
    new Set(allPhotos.map(p => p.category).filter(Boolean))
  ) as string[]

  const loading = userLoading || publicLoading
  const error = userError || publicError

  const handleRefresh = useCallback(() => {
    if (showUserPhotos) refreshUser()
    if (showPublicPhotos) refreshPublic()
  }, [showUserPhotos, showPublicPhotos, refreshUser, refreshPublic])

  const handlePhotoClick = useCallback((photo: GooglePhotoLink) => {
    onPhotoClick?.(photo)
    // Abrir foto em nova aba como fallback
    if (!onPhotoClick) {
      window.open(photo.url, '_blank', 'noopener,noreferrer')
    }
  }, [onPhotoClick])

  // Renderizar foto individual
  const renderPhoto = (photo: GooglePhotoLink) => {
    const isOwner = photo.user_id === user?.id

    if (viewMode === 'grid') {
      return (
        <div
          key={photo.id}
          className="group cursor-pointer aspect-square relative overflow-hidden rounded-lg bg-gray-100 hover:shadow-lg transition-all duration-300"
          onClick={() => handlePhotoClick(photo)}
        >
          {/* Placeholder com link para foto */}
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-200">
            <div className="text-center p-4">
              <ImageIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-xs text-gray-600 font-medium truncate">{photo.title}</p>
              {photo.category && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {photo.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Overlay com informações */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 flex items-end">
            <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-full">
              <p className="text-sm font-medium truncate">{photo.title}</p>
              <p className="text-xs text-gray-200 truncate">Por {photo.user_name}</p>
              
              <div className="flex justify-between items-center mt-2 text-xs">
                <div className="flex space-x-3">
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
                  {isOwner && (
                    <Badge variant="secondary" className="text-xs">
                      Minha
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(photo.url, '_blank')
                    }}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div
          key={photo.id}
          className="flex items-center space-x-4 bg-white rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handlePhotoClick(photo)}
        >
          {/* Thumbnail placeholder */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-6 h-6 text-blue-400" />
          </div>

          {/* Informações */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{photo.title}</h3>
            {photo.description && (
              <p className="text-sm text-gray-600 truncate">{photo.description}</p>
            )}
            
            <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
              <span>Por {photo.user_name}</span>
              {photo.category && (
                <Badge variant="secondary" className="text-xs">
                  {photo.category}
                </Badge>
              )}
              <span>{photo.likes_count} ❤️</span>
              <span>{photo.views_count} 👁️</span>
              {isOwner && (
                <Badge variant="outline" className="text-xs">
                  Minha foto
                </Badge>
              )}
            </div>
          </div>

          {/* Botão para abrir */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              window.open(photo.url, '_blank')
            }}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  }

  if (!user) {
    return (
      <OrkutCard className={className}>
        <OrkutCardContent className="p-6 text-center">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Login Necessário</h3>
          <p className="text-gray-600">Faça login para ver as fotos</p>
        </OrkutCardContent>
      </OrkutCard>
    )
  }

  return (
    <OrkutCard className={className}>
      <OrkutCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-medium">Galeria Google Photos</h3>
            <Badge variant="secondary" className="text-xs">
              {filteredPhotos.length} foto{filteredPhotos.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </Button>
            
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </OrkutCardHeader>
      
      <OrkutCardContent className="space-y-4">
        {/* Busca e Filtros */}
        {showSearch && (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Input
                placeholder="Buscar fotos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button variant="ghost" size="sm">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Filtro de categorias */}
            {availableCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={!selectedCategory ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory('')}
                >
                  Todas
                </Button>
                {availableCategories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h4 className="font-medium text-red-800">Erro ao carregar fotos</h4>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={handleRefresh}
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Carregando fotos...</p>
          </div>
        )}

        {/* Galeria de Fotos */}
        {!loading && !error && filteredPhotos.length > 0 && (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              : "space-y-3"
          )}>
            {filteredPhotos.map(renderPhoto)}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredPhotos.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma foto encontrada
            </h4>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCategory 
                ? 'Tente ajustar os filtros de busca'
                : 'Adicione algumas fotos do Google Photos para começar'
              }
            </p>
            {(searchQuery || selectedCategory) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('')
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        )}
      </OrkutCardContent>
    </OrkutCard>
  )
}
