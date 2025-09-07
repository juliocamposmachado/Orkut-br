'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Button } from '@/components/ui/button'
import { ImprovedPhotoCard } from '@/components/photos/improved-photo-card'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, 
  Upload, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle,
  Loader2,
  FolderOpen,
  Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface GoogleDrivePhoto {
  id: string
  name: string
  webViewLink?: string
  webContentLink?: string
  thumbnailLink?: string
  createdTime: string
  modifiedTime: string
  size?: string
  mimeType: string
}

interface UserPhotosGalleryProps {
  className?: string
  onPhotoClick?: (photo: GoogleDrivePhoto) => void
}

export function UserPhotosGallery({ className, onPhotoClick }: UserPhotosGalleryProps) {
  const { user, profile } = useAuth()
  const [photos, setPhotos] = useState<GoogleDrivePhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserPhotos = useCallback(async () => {
    if (!user) {
      setError('Usuário não autenticado')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Buscando fotos do usuário:', user.email)
      
      const response = await fetch('/api/photos/google-drive', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}` // Usar o ID do usuário como referência
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.photos && Array.isArray(data.photos)) {
        setPhotos(data.photos)
        console.log('✅ Fotos carregadas:', data.photos.length)
      } else {
        console.warn('⚠️ Resposta inesperada:', data)
        setPhotos([])
      }

    } catch (err: any) {
      console.error('❌ Erro ao buscar fotos:', err)
      setError(err.message || 'Erro ao carregar fotos')
    } finally {
      setLoading(false)
    }
  }, [user])

  const handleConnectGoogleDrive = useCallback(() => {
    // Abrir Google Drive para o usuário fazer upload manualmente
    window.open('https://drive.google.com/drive/my-drive', '_blank', 'noopener,noreferrer')
  }, [])

  const handleConnectGooglePhotos = useCallback(() => {
    // Abrir Google Photos para o usuário gerenciar suas fotos
    const googlePhotosUrl = user?.email 
      ? `https://photos.google.com/?authuser=${encodeURIComponent(user.email)}`
      : 'https://photos.google.com/'
    
    window.open(googlePhotosUrl, '_blank', 'noopener,noreferrer')
  }, [user?.email])

  useEffect(() => {
    if (user) {
      fetchUserPhotos()
    }
  }, [user, fetchUserPhotos])

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
              onClick={fetchUserPhotos}
              disabled={loading}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectGoogleDrive}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir Drive
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectGooglePhotos}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir Photos
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
            <div className="mt-3 space-x-2">
              <Button size="sm" variant="outline" onClick={fetchUserPhotos}>
                Tentar novamente
              </Button>
              <Button size="sm" variant="outline" onClick={handleConnectGoogleDrive}>
                Abrir Google Drive
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
              Faça upload de fotos no seu Google Drive para vê-las aqui
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button 
                onClick={handleConnectGoogleDrive}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Fazer Upload no Drive
              </Button>
              <Button 
                onClick={handleConnectGooglePhotos}
                variant="outline"
              >
                <Camera className="w-4 h-4 mr-2" />
                Abrir Google Photos
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && photos.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
              {photos.map((photo) => (
                <ImprovedPhotoCard
                  key={photo.id}
                  id={photo.id}
                  src={photo.thumbnailLink || photo.webContentLink || '/placeholder-image.jpg'}
                  title={photo.name}
                  description={`Criada: ${new Date(photo.createdTime).toLocaleDateString('pt-BR')}`}
                  className="aspect-square"
                  onClick={() => onPhotoClick?.(photo)}
                />
              ))}
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{photos.length}</div>
                  <p className="text-xs text-gray-600">Fotos Encontradas</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">15GB</div>
                  <p className="text-xs text-gray-600">Espaço Gratuito</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">∞</div>
                  <p className="text-xs text-gray-600">Backup Automático</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-xs text-gray-600 text-center">
                  📱 Suas fotos são sincronizadas automaticamente com Google Drive e Google Photos
                </p>
              </div>
            </div>
          </>
        )}
      </OrkutCardContent>
    </OrkutCard>
  )
}
