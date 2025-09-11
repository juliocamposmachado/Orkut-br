'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  CloudUpload, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Database,
  HardDrive,
  Wifi,
  WifiOff,
  Sync,
  Clock,
  Eye,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface LocalPhoto {
  id: string
  imgur_url: string
  direct_url: string
  title: string
  description?: string
  tags: string[]
  file_size: number
  width: number
  height: number
  original_filename: string
  created_at: string
  
  // Estados de sincronização
  is_synced_to_supabase: boolean
  sync_attempts: number
  last_sync_attempt?: string
  sync_error?: string
  supabase_photo_id?: string
  supabase_feed_id?: string
}

interface OfflineGalleryManagerProps {
  className?: string
  onPhotoSynced?: (photo: LocalPhoto) => void
}

const LOCAL_STORAGE_KEY = 'orkut_offline_gallery'

export function OfflineGalleryManager({ 
  className, 
  onPhotoSynced 
}: OfflineGalleryManagerProps) {
  const { user, session } = useAuth()
  const [localPhotos, setLocalPhotos] = useState<LocalPhoto[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncInProgress, setSyncInProgress] = useState<Set<string>>(new Set())

  // Monitor status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Carregar fotos do localStorage na inicialização
  useEffect(() => {
    loadLocalPhotos()
  }, [])

  // Auto-sincronizar quando ficar online
  useEffect(() => {
    if (isOnline && user && session) {
      const unsyncedPhotos = localPhotos.filter(p => !p.is_synced_to_supabase)
      if (unsyncedPhotos.length > 0) {
        toast.info(`📡 Conexão detectada! ${unsyncedPhotos.length} foto(s) serão sincronizadas.`)
        setTimeout(() => syncAllPhotos(), 2000) // Delay para não sobrecarregar
      }
    }
  }, [isOnline, user, session])

  const loadLocalPhotos = useCallback(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const photos = JSON.parse(saved) as LocalPhoto[]
        setLocalPhotos(photos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      }
    } catch (error) {
      console.error('Erro ao carregar fotos locais:', error)
      toast.error('Erro ao carregar galeria local')
    }
  }, [])

  const saveLocalPhotos = useCallback((photos: LocalPhoto[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(photos))
      setLocalPhotos(photos)
    } catch (error) {
      console.error('Erro ao salvar fotos locais:', error)
      toast.error('Erro ao salvar na galeria local')
    }
  }, [])

  const addPhoto = useCallback((photoData: Omit<LocalPhoto, 'id' | 'created_at' | 'is_synced_to_supabase' | 'sync_attempts'>) => {
    const newPhoto: LocalPhoto = {
      ...photoData,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      is_synced_to_supabase: false,
      sync_attempts: 0
    }

    const updatedPhotos = [newPhoto, ...localPhotos]
    saveLocalPhotos(updatedPhotos)
    
    toast.success(`📱 Foto salva localmente! ${isOnline ? 'Sincronizando...' : 'Será sincronizada quando voltar online.'}`)

    // Se estiver online e logado, tentar sincronizar imediatamente
    if (isOnline && user && session) {
      setTimeout(() => syncPhoto(newPhoto.id), 1000)
    }

    return newPhoto
  }, [localPhotos, saveLocalPhotos, isOnline, user, session])

  const syncPhoto = useCallback(async (photoId: string) => {
    if (!user || !session) {
      toast.error('Faça login para sincronizar com o servidor')
      return false
    }

    const photo = localPhotos.find(p => p.id === photoId)
    if (!photo || photo.is_synced_to_supabase) {
      return true
    }

    // Marcar como em sincronização
    setSyncInProgress(prev => new Set(prev).add(photoId))

    try {
      console.log(`🔄 Sincronizando foto ${photo.id}...`)

      // 1. Salvar no feed global
      const feedResponse = await fetch('/api/photos/save-feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imgur_url: photo.direct_url,
          title: photo.title,
          description: photo.description || null,
          tags: photo.tags || [],
          width: photo.width,
          height: photo.height,
          file_size: photo.file_size,
          mime_type: 'image/jpeg',
          original_filename: photo.original_filename,
          is_public: true,
          user_token: session.access_token
        })
      })

      const feedResult = await feedResponse.json()

      if (!feedResult.success) {
        throw new Error(`Erro no feed: ${feedResult.error}`)
      }

      // 2. Salvar no álbum pessoal
      const albumResponse = await fetch('/api/photos/save-album', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imgur_link: photo.direct_url,
          titulo: photo.title,
          descricao: photo.description || '',
          is_public: true,
          user_token: session.access_token
        })
      })

      const albumResult = await albumResponse.json()

      // Atualizar status da foto
      const updatedPhotos = localPhotos.map(p =>
        p.id === photoId
          ? {
              ...p,
              is_synced_to_supabase: true,
              supabase_feed_id: feedResult.data?.id,
              supabase_photo_id: albumResult.success ? albumResult.data?.id : undefined,
              sync_error: undefined,
              last_sync_attempt: new Date().toISOString()
            }
          : p
      )

      saveLocalPhotos(updatedPhotos)

      // Callback de sucesso
      if (onPhotoSynced) {
        const syncedPhoto = updatedPhotos.find(p => p.id === photoId)
        if (syncedPhoto) onPhotoSynced(syncedPhoto)
      }

      console.log(`✅ Foto ${photoId} sincronizada com sucesso`)
      return true

    } catch (error) {
      console.error(`❌ Erro ao sincronizar foto ${photoId}:`, error)

      // Atualizar com erro
      const updatedPhotos = localPhotos.map(p =>
        p.id === photoId
          ? {
              ...p,
              sync_attempts: p.sync_attempts + 1,
              sync_error: error instanceof Error ? error.message : 'Erro desconhecido',
              last_sync_attempt: new Date().toISOString()
            }
          : p
      )

      saveLocalPhotos(updatedPhotos)
      return false

    } finally {
      setSyncInProgress(prev => {
        const newSet = new Set(prev)
        newSet.delete(photoId)
        return newSet
      })
    }
  }, [localPhotos, user, session, saveLocalPhotos, onPhotoSynced])

  const syncAllPhotos = useCallback(async () => {
    if (!user || !session) {
      toast.error('Faça login para sincronizar')
      return
    }

    const unsyncedPhotos = localPhotos.filter(p => !p.is_synced_to_supabase)
    if (unsyncedPhotos.length === 0) {
      toast.info('Todas as fotos já estão sincronizadas!')
      return
    }

    setIsSyncing(true)
    let successCount = 0
    let errorCount = 0

    toast.info(`🔄 Sincronizando ${unsyncedPhotos.length} foto(s)...`)

    try {
      for (const photo of unsyncedPhotos) {
        const success = await syncPhoto(photo.id)
        if (success) {
          successCount++
        } else {
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`✅ ${successCount} foto(s) sincronizada(s) com sucesso!`)
      }

      if (errorCount > 0) {
        toast.error(`❌ ${errorCount} foto(s) falharam na sincronização`)
      }

    } catch (error) {
      console.error('Erro na sincronização em lote:', error)
      toast.error('Erro na sincronização em lote')
    } finally {
      setIsSyncing(false)
    }
  }, [localPhotos, user, session, syncPhoto])

  const removePhoto = useCallback((photoId: string) => {
    const updatedPhotos = localPhotos.filter(p => p.id !== photoId)
    saveLocalPhotos(updatedPhotos)
    toast.success('Foto removida da galeria local')
  }, [localPhotos, saveLocalPhotos])

  const clearLocalGallery = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    setLocalPhotos([])
    toast.success('Galeria local limpa')
  }, [])

  // Estatísticas
  const stats = {
    total: localPhotos.length,
    synced: localPhotos.filter(p => p.is_synced_to_supabase).length,
    pending: localPhotos.filter(p => !p.is_synced_to_supabase).length,
    errors: localPhotos.filter(p => p.sync_error).length
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header com Status */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center space-x-1">
              <HardDrive className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">
                Galeria Local
              </span>
            </div>
          </div>

          {stats.pending > 0 && user && session && (
            <Button
              size="sm"
              variant="outline"
              onClick={syncAllPhotos}
              disabled={isSyncing || !isOnline}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Sync className={cn('w-4 h-4 mr-2', isSyncing && 'animate-spin')} />
              Sincronizar Todas ({stats.pending})
            </Button>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{stats.synced}</div>
            <p className="text-xs text-gray-600">Sincronizadas</p>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-gray-600">Pendentes</p>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">{stats.errors}</div>
            <p className="text-xs text-gray-600">Erros</p>
          </div>
        </div>
      </div>

      {/* Lista de Fotos */}
      {localPhotos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Upload className="w-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma foto na galeria local</h3>
          <p className="text-sm">Faça upload de fotos para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {localPhotos.map((photo) => (
            <div key={photo.id} className="bg-white rounded-lg border overflow-hidden">
              {/* Preview da imagem */}
              <div className="aspect-video bg-gray-100 relative">
                <img
                  src={photo.direct_url}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Status overlay */}
                <div className="absolute top-2 right-2 flex space-x-1">
                  {syncInProgress.has(photo.id) && (
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                    </div>
                  )}
                  
                  {photo.is_synced_to_supabase ? (
                    <div className="bg-green-500 text-white rounded-full p-1">
                      <CheckCircle className="w-3 h-3" />
                    </div>
                  ) : photo.sync_error ? (
                    <div className="bg-red-500 text-white rounded-full p-1">
                      <AlertCircle className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className="bg-yellow-500 text-white rounded-full p-1">
                      <Clock className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Controles */}
                <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => window.open(photo.direct_url, '_blank')}
                    className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 hover:bg-white transition-colors"
                    title="Ver foto"
                  >
                    <Eye className="w-3 h-3 text-gray-700" />
                  </button>
                  
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 hover:bg-white transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Info da foto */}
              <div className="p-3">
                <h4 className="font-medium text-sm truncate mb-1">{photo.title}</h4>
                {photo.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">{photo.description}</p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(photo.created_at).toLocaleDateString('pt-BR')}</span>
                  <div className="flex items-center space-x-2">
                    {!photo.is_synced_to_supabase && user && session && isOnline && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncPhoto(photo.id)}
                        disabled={syncInProgress.has(photo.id)}
                        className="h-6 px-2 text-xs"
                      >
                        <CloudUpload className="w-3 h-3 mr-1" />
                        Sincronizar
                      </Button>
                    )}
                    
                    {photo.is_synced_to_supabase && (
                      <Badge variant="secondary" className="h-5 px-2 text-xs">
                        <Database className="w-3 h-3 mr-1" />
                        Supabase
                      </Badge>
                    )}
                  </div>
                </div>

                {photo.sync_error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <div className="flex items-center space-x-1 mb-1">
                      <AlertCircle className="w-3 h-3" />
                      <span className="font-medium">Erro de sincronização</span>
                    </div>
                    <p>{photo.sync_error}</p>
                    <p className="text-red-600 mt-1">
                      Tentativas: {photo.sync_attempts} | 
                      Última: {photo.last_sync_attempt ? new Date(photo.last_sync_attempt).toLocaleString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {localPhotos.length > 0 && (
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            💾 Fotos salvas localmente: {stats.total} | 
            ☁️ Sincronizadas: {stats.synced} | 
            ⏳ Pendentes: {stats.pending}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearLocalGallery}
            className="text-red-600 hover:bg-red-50 border-red-300"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Galeria Local
          </Button>
        </div>
      )}
    </div>
  )
}

// Hook helper para usar o gerenciador
export function useOfflineGallery() {
  const [photos, setPhotos] = useState<LocalPhoto[]>([])

  const addPhoto = useCallback((photoData: Omit<LocalPhoto, 'id' | 'created_at' | 'is_synced_to_supabase' | 'sync_attempts'>) => {
    const newPhoto: LocalPhoto = {
      ...photoData,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      is_synced_to_supabase: false,
      sync_attempts: 0
    }

    // Salvar no localStorage
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    const existingPhotos = saved ? JSON.parse(saved) : []
    const updatedPhotos = [newPhoto, ...existingPhotos]
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPhotos))
    
    setPhotos(updatedPhotos)
    return newPhoto
  }, [])

  const loadPhotos = useCallback(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const photos = JSON.parse(saved) as LocalPhoto[]
        setPhotos(photos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error)
    }
  }, [])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  return {
    photos,
    addPhoto,
    loadPhotos
  }
}
