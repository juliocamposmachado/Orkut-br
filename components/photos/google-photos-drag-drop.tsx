'use client'

import { useState, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { Button } from '@/components/ui/button'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Upload, 
  ExternalLink, 
  AlertCircle,
  CheckCircle,
  Link as LinkIcon,
  Image as ImageIcon,
  Info,
  Eye,
  Share,
  Globe,
  Loader2,
  Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useGooglePhotosLinks } from '@/hooks/use-google-photos-links'

interface GooglePhotosDragDropProps {
  onPhotoAdded?: (photoLink: string) => void
  className?: string
  showGallery?: boolean
  maxPhotos?: number
}

export function GooglePhotosDragDrop({ 
  onPhotoAdded, 
  className, 
  showGallery = true,
  maxPhotos = 50 
}: GooglePhotosDragDropProps) {
  const { user, profile } = useAuth()
  const [isDragging, setIsDragging] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [manualLink, setManualLink] = useState('')
  const [manualTitle, setManualTitle] = useState('')
  const [manualCategory, setManualCategory] = useState('')
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Hook para gerenciar os links
  const {
    links: addedPhotos,
    loading: isProcessing,
    addLink,
    removeLink,
    refresh,
    stats
  } = useGooglePhotosLinks({ autoFetch: showGallery })

  const isValidGooglePhotosUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname === 'photos.google.com' || 
             urlObj.hostname.includes('photos.app.goo.gl') ||
             urlObj.hostname.includes('lh3.googleusercontent.com')
    } catch {
      return false
    }
  }, [])

  const extractPhotoTitle = useCallback((url: string): string => {
    try {
      // Tentar extrair título do URL ou usar padrão
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      const shareId = pathParts.find(part => part.startsWith('AF1Q'))
      return shareId ? `Foto ${shareId.substring(0, 8)}...` : 'Foto do Google Photos'
    } catch {
      return 'Foto do Google Photos'
    }
  }, [])

  const addPhotoLink = useCallback(async (url: string, title?: string, category?: string) => {
    if (!isValidGooglePhotosUrl(url)) {
      toast.error('❌ URL inválida! Use apenas links do Google Photos')
      return false
    }

    // Verificar limite de fotos
    if (addedPhotos.length >= maxPhotos) {
      toast.warning(`⚠️ Limite de ${maxPhotos} fotos atingido!`)
      return false
    }

    try {
      const photoTitle = title || extractPhotoTitle(url)
      await addLink(url, photoTitle, undefined, category, true)
      onPhotoAdded?.(url)
      return true
    } catch (error) {
      // Erro já tratado pelo hook
      return false
    }
  }, [isValidGooglePhotosUrl, extractPhotoTitle, addedPhotos.length, maxPhotos, addLink, onPhotoAdded])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragCounter(prev => prev + 1)
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragCounter(prev => prev - 1)
    if (dragCounter <= 1) {
      setIsDragging(false)
    }
  }, [dragCounter])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setDragCounter(0)

    const items = Array.from(e.dataTransfer.items)
    
    for (const item of items) {
      if (item.type === 'text/plain') {
        const text = await new Promise<string>((resolve) => {
          item.getAsString(resolve)
        })
        
        if (text) {
          await addPhotoLink(text.trim())
        }
      } else if (item.type === 'text/uri-list') {
        const uri = await new Promise<string>((resolve) => {
          item.getAsString(resolve)
        })
        
        if (uri) {
          await addPhotoLink(uri.trim())
        }
      }
    }
  }, [addPhotoLink])

  const handleManualAdd = useCallback(async () => {
    if (!manualLink.trim()) return
    
    const success = await addPhotoLink(
      manualLink.trim(), 
      manualTitle.trim() || undefined,
      manualCategory.trim() || undefined
    )
    if (success) {
      setManualLink('')
      setManualTitle('')
      setManualCategory('')
    }
  }, [manualLink, manualTitle, manualCategory, addPhotoLink])

  const removePhoto = useCallback(async (photoId: string) => {
    try {
      await removeLink(photoId)
    } catch (error) {
      // Erro já tratado pelo hook
    }
  }, [removeLink])

  const openGooglePhotos = useCallback(() => {
    const googlePhotosUrl = user?.email 
      ? `https://photos.google.com/?authuser=${encodeURIComponent(user.email)}`
      : 'https://photos.google.com/'
    
    window.open(googlePhotosUrl, '_blank', 'noopener,noreferrer')
  }, [user?.email])

  if (!user) {
    return (
      <OrkutCard className={className}>
        <OrkutCardContent className="p-6 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Login Necessário</h3>
          <p className="text-gray-600">Faça login para adicionar fotos</p>
        </OrkutCardContent>
      </OrkutCard>
    )
  }

  return (
    <OrkutCard className={className}>
      <OrkutCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LinkIcon className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-medium">Adicionar do Google Photos</h3>
            <Badge variant="secondary" className="text-xs">
              Drag & Drop
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={openGooglePhotos}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Google Photos
          </Button>
        </div>
      </OrkutCardHeader>
      
      <OrkutCardContent className="space-y-4">
        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-800 mb-1">Como usar:</h4>
              <ol className="text-blue-700 space-y-1 text-xs">
                <li>1. Abra o Google Photos em uma nova aba</li>
                <li>2. Encontre a foto que deseja compartilhar</li>
                <li>3. Clique em <strong>Compartilhar</strong> → <strong>Copiar link</strong></li>
                <li>4. Cole o link abaixo OU arraste e solte na área pontilhada</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Área de Drag & Drop */}
        <div
          ref={dropZoneRef}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300",
            isDragging 
              ? "border-blue-500 bg-blue-50 scale-105" 
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isDragging ? (
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-blue-500 mx-auto animate-bounce" />
              <p className="text-blue-600 font-medium">Solte o link aqui!</p>
              <p className="text-xs text-blue-500">Link do Google Photos</p>
            </div>
          ) : (
            <div className="space-y-2">
              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-gray-600 font-medium">Arraste e solte o link aqui</p>
              <p className="text-xs text-gray-500">ou use o campo abaixo para colar manualmente</p>
            </div>
          )}
        </div>

        {/* Input Manual */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Ou adicione manualmente:
          </label>
          
          {/* URL da foto */}
          <div className="space-y-2">
            <Input
              placeholder="https://photos.google.com/share/AF1QipN..."
              value={manualLink}
              onChange={(e) => setManualLink(e.target.value)}
              className="w-full"
            />
          </div>
          
          {/* Campos opcionais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="Título da foto (opcional)"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              className="text-sm"
            />
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Categoria (opcional)"
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                className="text-sm pl-9"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleManualAdd}
            disabled={!manualLink.trim() || isProcessing}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
            ) : (
              <Upload className="w-4 h-4 mr-2 text-white" />
            )}
            <span className="text-white font-medium">
              {isProcessing ? 'Adicionando...' : 'Adicionar Foto'}
            </span>
          </Button>
        </div>

        {/* Aviso Importante */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-700">
              <p className="font-medium mb-1">⚠️ Importante:</p>
              <p>Para que as fotos funcionem no Orkut, o <strong>álbum deve estar público</strong> no Google Photos. 
                 Fotos privadas não serão exibidas para outros usuários.</p>
            </div>
          </div>
        </div>

        {/* Lista de Fotos Adicionadas */}
        {showGallery && addedPhotos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Suas Fotos ({addedPhotos.length}/{maxPhotos})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </Button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {addedPhotos.map((photo) => (
                <div key={photo.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <ImageIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-green-700 truncate block">{photo.title}</span>
                      {photo.category && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {photo.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(photo.url, '_blank')}
                      className="h-6 w-6 p-0"
                      title="Ver foto"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePhoto(photo.id)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      title="Remover foto"
                      disabled={isProcessing}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estatísticas */}
        {showGallery && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
                <p className="text-xs text-gray-600">Fotos Salvas</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.totalLikes}</div>
                <p className="text-xs text-gray-600">Total Curtidas</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
                <p className="text-xs text-gray-600">Total Views</p>
              </div>
            </div>
            
            {/* Categorias */}
            {Object.keys(stats.byCategory).length > 0 && (
              <div className="mt-4 pt-3 border-t border-purple-200">
                <p className="text-xs text-gray-600 mb-2">Categorias:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.byCategory).map(([category, count]) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category} ({count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </OrkutCardContent>
    </OrkutCard>
  )
}
