'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PhotoCard } from '@/components/photos/photo-card'
import { PhotoModal } from '@/components/photos/photo-modal'
import { 
  profilePhotosData, 
  getUserPhotos, 
  getRecentPhotos, 
  getPhotosByCategory,
  ProfilePhoto 
} from '@/data/profile-photos'
import { 
  Camera, 
  Filter, 
  Search, 
  Users, 
  TrendingUp, 
  Upload,
  Grid3x3,
  List,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type ViewMode = 'grid' | 'list'
type FilterMode = 'all' | 'recent' | 'category' | 'user'

export default function PhotosPage() {
  const { user, profile } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<ProfilePhoto[]>([])
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

  // Obter todas as fotos com filtros aplicados
  const filteredPhotos = useMemo(() => {
    let photos: ProfilePhoto[] = []
    
    switch (filterMode) {
      case 'recent':
        photos = getRecentPhotos(24)
        break
      case 'category':
        if (selectedCategory) {
          photos = getPhotosByCategory(selectedCategory)
        }
        break
      case 'user':
        if (selectedUser) {
          const userPhotos = getUserPhotos(selectedUser)
          photos = userPhotos?.photos || []
        }
        break
      default:
        // Todas as fotos
        profilePhotosData.forEach(user => {
          photos.push(...user.photos)
        })
    }
    
    // Aplicar busca por texto
    if (searchQuery) {
      photos = photos.filter(photo => 
        photo.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return photos
  }, [filterMode, selectedCategory, selectedUser, searchQuery])

  // Obter categorias únicas
  const categories = useMemo(() => {
    const cats = new Set<string>()
    profilePhotosData.forEach(user => {
      user.photos.forEach(photo => {
        if (photo.category) cats.add(photo.category)
      })
    })
    return Array.from(cats).sort()
  }, [])

  // Obter usuários com fotos
  const usersWithPhotos = useMemo(() => {
    return profilePhotosData.filter(user => user.photos.length > 0)
  }, [])

  const openPhotoModal = useCallback((photoId: string, photos: ProfilePhoto[]) => {
    const index = photos.findIndex(p => p.id === photoId)
    if (index >= 0) {
      setSelectedPhotos(photos)
      setSelectedPhotoIndex(index)
      setModalOpen(true)
    }
  }, [])

  const getUserDisplayName = (photoId: string): string => {
    for (const user of profilePhotosData) {
      if (user.photos.some(p => p.id === photoId)) {
        return user.displayName
      }
    }
    return 'Usuário'
  }

  const clearFilters = () => {
    setFilterMode('all')
    setSelectedCategory('')
    setSelectedUser('')
    setSearchQuery('')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Camera className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Faça login para ver as fotos</h2>
          <p className="text-gray-600 mb-4">Conecte-se para explorar a galeria da comunidade</p>
          <Button asChild>
            <Link href="/login">Fazer Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-3">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Orkut Fotos</h1>
                <p className="text-purple-100">
                  Explore {filteredPhotos.length} fotos da comunidade
                </p>
              </div>
            </div>
            
            <Button 
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Foto
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          
          {/* Sidebar Filtros */}
          <div className="space-y-4">
            {/* Busca */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Buscar Fotos</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <Input
                  placeholder="Digite para buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </OrkutCardContent>
            </OrkutCard>

            {/* Filtros Rápidos */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filtros</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent className="space-y-3">
                <div className="space-y-2">
                  <Button
                    variant={filterMode === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setFilterMode('all')
                      setSelectedCategory('')
                      setSelectedUser('')
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Todas as Fotos
                  </Button>
                  
                  <Button
                    variant={filterMode === 'recent' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setFilterMode('recent')
                      setSelectedCategory('')
                      setSelectedUser('')
                    }}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Mais Recentes
                  </Button>
                </div>
                
                {(filterMode !== 'all' || searchQuery) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Limpar Filtros
                  </Button>
                )}
              </OrkutCardContent>
            </OrkutCard>

            {/* Categorias */}
            <OrkutCard>
              <OrkutCardHeader>
                <span>Categorias</span>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategory === category ? "default" : "secondary"}
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => {
                        setSelectedCategory(category === selectedCategory ? '' : category)
                        setFilterMode('category')
                        setSelectedUser('')
                      }}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* Usuários */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Por Usuário</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-2">
                  {usersWithPhotos.map((user) => (
                    <Button
                      key={user.username}
                      variant={selectedUser === user.username ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedUser(user.username === selectedUser ? '' : user.username)
                        setFilterMode('user')
                        setSelectedCategory('')
                      }}
                    >
                      <Avatar className="w-6 h-6 mr-2">
                        <AvatarImage src={user.profilePhoto} />
                        <AvatarFallback>
                          {user.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="text-xs font-medium truncate">
                          {user.displayName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.photos.length} fotos
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </OrkutCardContent>
            </OrkutCard>
          </div>

          {/* Grid de Fotos */}
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {filteredPhotos.length} foto{filteredPhotos.length !== 1 ? 's' : ''} encontrada{filteredPhotos.length !== 1 ? 's' : ''}
                </span>
                {(filterMode !== 'all' || searchQuery) && (
                  <div className="flex items-center space-x-2">
                    {selectedCategory && (
                      <Badge variant="outline">#{selectedCategory}</Badge>
                    )}
                    {selectedUser && (
                      <Badge variant="outline">
                        @{usersWithPhotos.find(u => u.username === selectedUser)?.displayName}
                      </Badge>
                    )}
                    {searchQuery && (
                      <Badge variant="outline">"{searchQuery}"</Badge>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
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

            {/* Grid de Fotos */}
            {filteredPhotos.length > 0 ? (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                  : "space-y-4"
              )}>
                {filteredPhotos.map((photo) => (
                  <div 
                    key={photo.id}
                    className={cn(
                      "group cursor-pointer",
                      viewMode === 'grid' ? "aspect-square" : "flex items-center space-x-4 bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                    )}
                    onClick={() => openPhotoModal(photo.id, filteredPhotos)}
                  >
                    {viewMode === 'grid' ? (
                      <PhotoCard
                        id={photo.id}
                        src={photo.url}
                        title={photo.title}
                        className="w-full h-full"
                      />
                    ) : (
                      <>
                        <PhotoCard
                          id={photo.id}
                          src={photo.url}
                          title={photo.title}
                          className="w-16 h-16 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {photo.title}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {photo.description || 'Sem descrição'}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {getUserDisplayName(photo.id)}
                            </span>
                            {photo.category && (
                              <Badge variant="secondary" className="text-xs">
                                {photo.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma foto encontrada
                </h3>
                <p className="text-gray-600 mb-4">
                  Tente ajustar os filtros ou faça uma nova busca
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Foto */}
      <PhotoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        photos={selectedPhotos}
        initialIndex={selectedPhotoIndex}
        userName={selectedPhotos[selectedPhotoIndex] ? getUserDisplayName(selectedPhotos[selectedPhotoIndex].id) : undefined}
      />

      <Footer />
    </div>
  )
}
