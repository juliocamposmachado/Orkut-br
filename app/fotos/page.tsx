'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PhotoCard } from '@/components/photos/photo-card'
import { ImprovedPhotoCard } from '@/components/photos/improved-photo-card'
import { PhotoModal } from '@/components/photos/photo-modal'
import { PhotoUpload } from '@/components/photos/photo-upload'
import { DirectUpload } from '@/components/photos/direct-upload'
import { GooglePhotoUpload } from '@/components/photos/GooglePhotoUpload'
import { GooglePhotosSetup } from '@/components/photos/GooglePhotosSetup'
import { GoogleDriveUpload } from '@/components/photos/GoogleDriveUpload'
import { CustomGoogleDriveUpload } from '@/components/photos/CustomGoogleDriveUpload'
import { UserPhotosGallery } from '@/components/photos/user-photos-gallery'
import { GooglePhotosDragDrop } from '@/components/photos/google-photos-drag-drop'
import { GooglePhotosGallery } from '@/components/photos/google-photos-gallery'
import { usePhotos, type Photo } from '@/hooks/use-photos'
import { 
  Camera, 
  Filter, 
  Search, 
  Users, 
  TrendingUp, 
  Upload,
  Grid3x3,
  List,
  Eye,
  RefreshCw,
  Heart,
  MessageCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  Monitor
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type ViewMode = 'grid' | 'list'

export default function PhotosPage() {
  const { user, profile } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([])
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  
  // Hook personalizado para gerenciar fotos
  const {
    photos,
    loading,
    error,
    stats,
    popularCategories,
    pagination,
    fetchPhotos,
    loadMore,
    refreshPhotos,
    likePhoto,
    incrementViews,
    filters,
    setFilters,
    clearFilters
  } = usePhotos()
  
  // Estado para verificar se está em modo demo
  const [isDemoMode, setIsDemoMode] = useState(false)
  // Estado para verificar se Google Photos está configurado
  const [isGooglePhotosConfigured, setIsGooglePhotosConfigured] = useState(false)
  // Estado para verificar se Google Drive está configurado  
  const [isGoogleDriveConfigured, setIsGoogleDriveConfigured] = useState(true) // Drive já está ativo
  // Estado para controlar o iframe do Flickr
  const [showFlickrIframe, setShowFlickrIframe] = useState(false)
  // Estado para controlar o iframe do Google Photos (iniciar aberto)
  const [showGooglePhotosIframe, setShowGooglePhotosIframe] = useState(true)

  // Aplicar filtros quando mudarem
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setFilters({ ...filters, search: value || undefined, offset: 0 })
  }, [filters, setFilters])

  const handleCategoryFilter = useCallback((category: string) => {
    const newCategory = category === selectedCategory ? '' : category
    setSelectedCategory(newCategory)
    setFilters({ 
      ...filters, 
      category: newCategory || undefined,
      userId: undefined,
      offset: 0 
    })
    setSelectedUser('')
  }, [selectedCategory, filters, setFilters])

  const handleUserFilter = useCallback((userId: string) => {
    const newUser = userId === selectedUser ? '' : userId
    setSelectedUser(newUser)
    setFilters({ 
      ...filters, 
      userId: newUser || undefined,
      category: undefined,
      offset: 0 
    })
    setSelectedCategory('')
  }, [selectedUser, filters, setFilters])

  const handleShowAll = useCallback(() => {
    setSelectedCategory('')
    setSelectedUser('')
    setSearchQuery('')
    clearFilters()
  }, [clearFilters])

  const handleShowRecent = useCallback(() => {
    setSelectedCategory('')
    setSelectedUser('')
    setFilters({ ...filters, offset: 0 })
  }, [filters, setFilters])

  const openPhotoModal = useCallback((photoId: string, photosArray: Photo[]) => {
    const index = photosArray.findIndex(p => p.id === photoId)
    if (index >= 0) {
      setSelectedPhotos(photosArray)
      setSelectedPhotoIndex(index)
      setModalOpen(true)
      // Incrementar views quando abrir modal
      incrementViews(photoId)
    }
  }, [incrementViews])

  const handleUploadComplete = useCallback((uploadedPhotos: any[]) => {
    // Refresh das fotos após upload
    refreshPhotos()
  }, [refreshPhotos])

  const handleLikePhoto = useCallback(async (photoId: string) => {
    await likePhoto(photoId)
  }, [likePhoto])
  
  // Função para abrir Google Photos com login automático
  const openGooglePhotosWithLogin = useCallback(() => {
    console.log('[Google Photos] Tentando abrir com login automático para:', user?.email)
    
    // Estratégia 1: Usar link direto com hint de email
    const userEmail = user?.email
    let googlePhotosUrl = 'https://photos.google.com/'
    
    if (userEmail) {
      // Adicionar hint de login para o Google
      googlePhotosUrl = `https://accounts.google.com/signin/v2/identifier?service=picasa&continue=https://photos.google.com/&authuser=${encodeURIComponent(userEmail)}&flowName=GlifWebSignIn&flowEntry=ServiceLogin&hl=pt-BR`
      console.log('[Google Photos] URL com login hint:', googlePhotosUrl)
    }
    
    // Abrir em nova aba
    window.open(googlePhotosUrl, '_blank', 'noopener,noreferrer')
  }, [user?.email])
  
  // Função para gerar URL do iframe com login
  const getGooglePhotosIframeUrl = useCallback(() => {
    const userEmail = user?.email
    
    if (userEmail) {
      // Tentar URLs que podem funcionar melhor em iframes
      const iframeUrls = [
        `https://photos.google.com/?authuser=${encodeURIComponent(userEmail)}`,
        `https://photos.google.com/?hl=pt-BR&authuser=${encodeURIComponent(userEmail)}`,
        'https://photos.google.com/'
      ]
      
      console.log('[Google Photos] URLs para iframe:', iframeUrls)
      return iframeUrls[0] // Usar a primeira por enquanto
    }
    
    return 'https://photos.google.com/'
  }, [user?.email])
  
  // Detectar modo demo e configuração do Google Photos
  useEffect(() => {
    const checkDemoMode = async () => {
      try {
        const response = await fetch('/api/photos?limit=1')
        const data = await response.json()
        setIsDemoMode(!!data.demo)
      } catch (err) {
        console.warn('Erro ao verificar modo demo:', err)
      }
    }
    
    // Verificar se Google Photos está configurado
    const checkGooglePhotosConfig = () => {
      // Verificar se as variáveis de ambiente estão definidas no cliente
      // Como não podemos acessar diretamente, vamos assumir que não está configurado
      // até que o usuário configure manualmente
      const hasGoogleConfig = false // Será true quando configurado
      setIsGooglePhotosConfigured(hasGoogleConfig)
    }
    
    checkDemoMode()
    checkGooglePhotosConfig()
  }, [])

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
                {loading 
                  ? 'Carregando fotos...' 
                  : `Explore ${stats?.total || photos.length} fotos da comunidade`
                }
              </p>
            </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={refreshPhotos}
                disabled={loading}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
                Atualizar
              </Button>
              {/* Google Drive Upload - Sempre disponível */}
              <GoogleDriveUpload 
                onUploadComplete={handleUploadComplete}
                trigger={
                  <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    Google Drive
                  </Button>
                }
              />
              {/* Google Photos Upload - Quando configurado */}
              {isGooglePhotosConfigured ? (
                <GooglePhotoUpload 
                  onUploadComplete={handleUploadComplete}
                  trigger={
                    <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
                      <Upload className="w-4 h-4 mr-2" />
                      Google Photos
                    </Button>
                  }
                />
              ) : null}
              <PhotoUpload 
                onUploadComplete={handleUploadComplete}
                categories={popularCategories.map(c => c.category)}
              />
              <DirectUpload 
                onUploadComplete={handleUploadComplete}
                bucket="user-photos"
                folder="direct-uploads"
              />
              {/* Pasta personalizada do Google Drive */}
              <CustomGoogleDriveUpload 
                onUploadComplete={handleUploadComplete}
                trigger={
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    Minha Pasta
                  </Button>
                }
              />
              {/* Botão para mostrar/ocultar iframe do Flickr */}
              <Button
                variant="secondary"
                className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white"
                onClick={() => setShowFlickrIframe(!showFlickrIframe)}
              >
                <Monitor className="w-4 h-4 mr-2" />
                {showFlickrIframe ? 'Fechar' : 'Abrir'} Flickr
              </Button>
              {/* Botão para mostrar/ocultar iframe do Google Photos */}
              <Button
                variant="secondary"
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
                onClick={() => setShowGooglePhotosIframe(!showGooglePhotosIframe)}
              >
                <Monitor className="w-4 h-4 mr-2" />
                {showGooglePhotosIframe ? 'Fechar' : 'Abrir'} Google Photos
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Banner Demo Mode */}
        {isDemoMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <h3 className="font-medium text-blue-800">Modo Demonstração Ativo</h3>
            </div>
            <p className="text-blue-700 text-sm">
              Você está visualizando fotos de exemplo. Para upload e funcionalidade completa, 
              configure o banco de dados Supabase.
            </p>
          </div>
        )}
        
        {/* Flickr Upload Iframe */}
        {showFlickrIframe && (
          <div className="mb-6">
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-5 h-5 text-pink-500" />
                    <h3 className="text-lg font-medium">Upload de Fotos via Flickr</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://www.flickr.com/photos/upload/', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir em nova aba
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFlickrIframe(false)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent className="p-0">
                <div className="relative w-full" style={{ height: '600px' }}>
                  <iframe
                    src="https://www.flickr.com/photos/upload/"
                    title="Flickr Upload"
                    className="w-full h-full border-0 rounded-b-lg"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 bg-gradient-to-r from-pink-50 to-violet-50 border-t">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                    <span>
                      Faça upload das suas fotos no Flickr e depois compartilhe os links aqui no Orkut!
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Dica: Após fazer upload no Flickr, você pode copiar o link da foto e colar nos campos de upload do Orkut.
                  </p>
                </div>
              </OrkutCardContent>
            </OrkutCard>
          </div>
        )}
        
        {/* Componente Drag & Drop para Google Photos */}
        <div className="mb-6">
          <GooglePhotosDragDrop 
            className="mb-4"
            showGallery={false}
            maxPhotos={30}
            onPhotoAdded={(photoLink) => {
              console.log('📸 Nova foto adicionada:', photoLink)
              // A foto será automaticamente exibida na galeria abaixo
              // O hook useGooglePhotosLinks vai atualizar a lista automaticamente
            }}
          />
        </div>

        {/* Galeria de Fotos do Google Photos */}
        <div className="mb-6">
          <GooglePhotosGallery 
            className="mb-4"
            showUserPhotos={true}
            showPublicPhotos={true}
            onPhotoClick={(photo) => {
              console.log('🖼️ Foto do Google Photos clicada:', photo)
              // Aqui você pode abrir um modal personalizado ou navegar
              // Por padrão, vai abrir o link do Google Photos em nova aba
            }}
          />
        </div>

        {/* Galeria de Fotos do Usuário Logado */}
        {showGooglePhotosIframe && (
          <div className="mb-6">
            <UserPhotosGallery 
              className="mb-4"
              onPhotoClick={(photo) => {
                console.log('📸 Foto clicada:', photo)
                // Aqui pode abrir um modal ou navegar para visualização da foto
              }}
            />
          </div>
        )}
        
        {/* Google Photos Setup */}
        {!isGooglePhotosConfigured && (
          <div className="mb-6">
            <GooglePhotosSetup />
          </div>
        )}
        
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
                  onChange={(e) => handleSearchChange(e.target.value)}
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
                    variant={!selectedCategory && !selectedUser ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleShowAll}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Todas as Fotos
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleShowRecent}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Mais Recentes
                  </Button>
                </div>
                
                {(selectedCategory || selectedUser || searchQuery) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleShowAll}
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
                  {popularCategories.map((categoryData) => (
                    <Badge
                      key={categoryData.category}
                      variant={selectedCategory === categoryData.category ? "default" : "secondary"}
                      className="cursor-pointer hover:bg-primary/80 flex items-center space-x-1"
                      onClick={() => handleCategoryFilter(categoryData.category)}
                    >
                      <span>{categoryData.category}</span>
                      <span className="text-xs opacity-75">({categoryData.count})</span>
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
                  {/* Mostrar usuários apenas se houver dados */}
                  {stats && Object.keys(stats.categories).length > 0 && (
                    <div className="text-xs text-gray-500 mb-2">
                      Total: {stats.total} fotos • Públicas: {stats.public}
                    </div>
                  )}
                  
                  {/* Implementar busca por usuário quando necessário */}
                  <div className="text-sm text-gray-500">
                    Filtrar por usuário em breve...
                  </div>
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
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Carregando...</span>
                    </div>
                  ) : (
                    `${photos.length} foto${photos.length !== 1 ? 's' : ''} encontrada${photos.length !== 1 ? 's' : ''}`
                  )}
                </span>
                {(selectedCategory || selectedUser || searchQuery) && (
                  <div className="flex items-center space-x-2">
                    {selectedCategory && (
                      <Badge variant="outline">#{selectedCategory}</Badge>
                    )}
                    {selectedUser && (
                      <Badge variant="outline">@{selectedUser}</Badge>
                    )}
                    {searchQuery && (
                      <Badge variant="outline">&quot;{searchQuery}&quot;</Badge>
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

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="font-medium text-red-800">Erro ao carregar fotos</h3>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={refreshPhotos}
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            {/* Grid de Fotos */}
            {!error && photos.length > 0 ? (
              <>
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                    : "space-y-4"
                )}>
                  {photos.map((photo) => (
                    <div 
                      key={photo.id}
                      className={cn(
                        "group cursor-pointer",
                        viewMode === 'grid' ? "aspect-square" : "flex items-center space-x-4 bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                      )}
                      onClick={() => openPhotoModal(photo.id, photos)}
                    >
                      {viewMode === 'grid' ? (
                        <div className="relative w-full h-full">
                          <PhotoCard
                            id={photo.id}
                            src={photo.thumbnail_url || photo.url}
                            title={photo.title}
                            className="w-full h-full"
                          />
                          {/* Stats overlay */}
                          <div className="absolute bottom-2 left-2 right-2 flex justify-between text-white text-xs">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-1">
                                <Heart className="w-3 h-3" />
                                <span>{photo.likes_count}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-3 h-3" />
                                <span>{photo.comments_count}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{photo.views_count}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <PhotoCard
                            id={photo.id}
                            src={photo.thumbnail_url || photo.url}
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
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-xs text-gray-500">
                                Por {photo.user_name}
                              </span>
                              {photo.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {photo.category}
                                </Badge>
                              )}
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{photo.likes_count} ❤️</span>
                                <span>{photo.comments_count} 💬</span>
                                <span>{photo.views_count} 👁️</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Load More Button */}
                {pagination.hasMore && (
                  <div className="text-center mt-8">
                    <Button 
                      onClick={loadMore}
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        `Carregar mais fotos (${pagination.total - photos.length} restantes)`
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : !loading && !error ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma foto encontrada
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedCategory || selectedUser || searchQuery 
                    ? 'Tente ajustar os filtros ou faça uma nova busca'
                    : 'Seja o primeiro a fazer upload de uma foto!'
                  }
                </p>
                {(selectedCategory || selectedUser || searchQuery) ? (
                  <Button variant="outline" onClick={handleShowAll}>
                    Limpar Filtros
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    {/* Google Drive sempre disponível */}
                    <GoogleDriveUpload 
                      onUploadComplete={handleUploadComplete}
                      trigger={
                        <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white">
                          <Upload className="w-4 h-4 mr-2" />
                          Salvar no Drive
                        </Button>
                      }
                    />
                    {/* Google Photos quando configurado */}
                    {isGooglePhotosConfigured && (
                      <GooglePhotoUpload 
                        onUploadComplete={handleUploadComplete}
                        trigger={
                          <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload via Google Photos
                          </Button>
                        }
                      />
                    )}
                    <PhotoUpload 
                      onUploadComplete={handleUploadComplete}
                      categories={popularCategories.map(c => c.category)}
                    />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modal de Foto */}
      {selectedPhotos.length > 0 && (
        <PhotoModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          photos={selectedPhotos}
          initialIndex={selectedPhotoIndex}
          userName={selectedPhotos[selectedPhotoIndex]?.user_name}
        />
      )}

      <Footer />
    </div>
  )
}
