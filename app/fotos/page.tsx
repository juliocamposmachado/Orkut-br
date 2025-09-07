'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, 
  Search, 
  Upload,
  Grid3x3,
  List,
  Eye,
  RefreshCw,
  Heart,
  MessageCircle,
  Loader2,
  AlertCircle,
  Plus,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Photo {
  id: string
  url: string
  thumbnail_url?: string
  title: string
  description?: string
  user_name: string
  category?: string
  likes_count: number
  comments_count: number
  views_count: number
  created_at: string
}

type ViewMode = 'grid' | 'list'

export default function PhotosPage() {
  const { user } = useAuth()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploading, setUploading] = useState(false)

  // Carregar fotos
  const loadPhotos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/photos')
      const data = await response.json()
      
      if (response.ok) {
        setPhotos(data.photos || [])
      } else {
        setError(data.error || 'Erro ao carregar fotos')
      }
    } catch (err) {
      console.error('Erro ao carregar fotos:', err)
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  // Upload de foto
  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) return

    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('title', uploadTitle)
      formData.append('description', uploadDescription)
      formData.append('category', 'geral')
      
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        setUploadFile(null)
        setUploadTitle('')
        setUploadDescription('')
        setShowUploadForm(false)
        loadPhotos() // Recarregar fotos
      } else {
        const data = await response.json()
        setError(data.error || 'Erro no upload')
      }
    } catch (err) {
      console.error('Erro no upload:', err)
      setError('Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  // Filtrar fotos por busca
  const filteredPhotos = photos.filter(photo =>
    photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    photo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    if (user) {
      loadPhotos()
    }
  }, [user])

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
                    : `${filteredPhotos.length} fotos encontradas`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={loadPhotos}
                disabled={loading}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
                Atualizar
              </Button>
              <Button 
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={() => setShowUploadForm(!showUploadForm)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Foto
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Upload Form */}
        {showUploadForm && (
          <div className="mb-6">
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Adicionar Nova Foto</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowUploadForm(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título da Foto</label>
                  <Input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Digite um título para sua foto"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição (opcional)</label>
                  <Input
                    type="text"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Descreva sua foto..."
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Selecionar Arquivo</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  {uploadFile && (
                    <div className="mt-2 text-sm text-gray-600">
                      Arquivo selecionado: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleUpload} 
                    disabled={!uploadFile || !uploadTitle.trim() || uploading}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Enviar Foto
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowUploadForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </OrkutCardContent>
            </OrkutCard>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          
          {/* Sidebar */}
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

            {/* Stats */}
            <OrkutCard>
              <OrkutCardHeader>
                <span>Estatísticas</span>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total de fotos:</span>
                    <span className="font-medium">{photos.length}</span>
                  </div>
                  {searchQuery && (
                    <div className="flex justify-between">
                      <span>Resultados:</span>
                      <span className="font-medium">{filteredPhotos.length}</span>
                    </div>
                  )}
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* Instruções */}
            <OrkutCard>
              <OrkutCardHeader>
                <span>Como usar</span>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>📸 Clique em "Nova Foto" para enviar suas imagens</p>
                  <p>🔍 Use a busca para encontrar fotos específicas</p>
                  <p>👁️ Clique nas fotos para visualizar</p>
                  <p>❤️ Curta e comente nas fotos dos amigos</p>
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
                    `${filteredPhotos.length} foto${filteredPhotos.length !== 1 ? 's' : ''} encontrada${filteredPhotos.length !== 1 ? 's' : ''}`
                  )}
                </span>
                {searchQuery && (
                  <Badge variant="outline">
                    &quot;{searchQuery}&quot;
                  </Badge>
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
                  <h3 className="font-medium text-red-800">Erro</h3>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={loadPhotos}
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            {/* Grid de Fotos */}
            {!error && filteredPhotos.length > 0 ? (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                  : "space-y-4"
              )}>
                {filteredPhotos.map((photo) => (
                  <div 
                    key={photo.id}
                    className={cn(
                      "group cursor-pointer transition-all hover:scale-[1.02]",
                      viewMode === 'grid' 
                        ? "aspect-square bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg" 
                        : "flex items-center space-x-4 bg-white rounded-lg p-4 hover:shadow-md"
                    )}
                  >
                    {viewMode === 'grid' ? (
                      <div className="relative w-full h-full">
                        <img
                          src={photo.thumbnail_url || photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        {/* Info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <h3 className="text-white text-sm font-medium truncate">{photo.title}</h3>
                          <div className="flex items-center justify-between text-white text-xs mt-1">
                            <span>Por {photo.user_name}</span>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <Heart className="w-3 h-3" />
                                <span>{photo.likes_count}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-3 h-3" />
                                <span>{photo.comments_count}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {photo.category && (
                          <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="text-xs">
                              {photo.category}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <img
                          src={photo.thumbnail_url || photo.url}
                          alt={photo.title}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          loading="lazy"
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
            ) : !loading && !error ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'Nenhuma foto encontrada' : 'Nenhuma foto ainda'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery 
                    ? 'Tente ajustar sua busca ou limpar o filtro'
                    : 'Seja o primeiro a fazer upload de uma foto!'
                  }
                </p>
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Limpar Busca
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setShowUploadForm(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeira Foto
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
