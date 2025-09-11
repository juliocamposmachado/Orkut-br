'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

export interface OptimisticPhoto {
  // IDs e identificadores
  id: string // ID local temporário
  imgur_id: string
  imgur_url: string
  imgur_page_url: string
  imgur_delete_url?: string
  
  // Dados do usuário
  user_id: string | null
  user_name: string
  user_avatar: string | null
  
  // Metadados da imagem
  width: number
  height: number
  file_size: number
  original_filename: string
  title: string
  description: string | null
  tags: string[]
  
  // Contadores
  likes_count: number
  comments_count: number
  shares_count: number
  views_count: number
  
  // Status de sincronização
  sync_status: 'optimistic' | 'syncing' | 'synced' | 'error'
  remote_id?: string // ID real do banco após sincronização
  created_at: string
  updated_at: string
  error_message?: string
  retry_count?: number
}

export interface UseOptimisticPhotosReturn {
  // Estado
  optimisticPhotos: OptimisticPhoto[]
  isLoading: boolean
  
  // Funções de manipulação
  addOptimisticPhoto: (photo: Omit<OptimisticPhoto, 'id' | 'sync_status' | 'created_at' | 'updated_at' | 'likes_count' | 'comments_count' | 'shares_count' | 'views_count'>) => string
  updatePhotoStatus: (localId: string, status: OptimisticPhoto['sync_status'], remoteId?: string, errorMessage?: string) => void
  removeOptimisticPhoto: (localId: string) => void
  clearOptimisticPhotos: () => void
  
  // Funções de sincronização
  syncPhotoToServer: (localId: string, userToken?: string) => Promise<void>
  retryFailedSync: (localId: string, userToken?: string) => Promise<void>
  syncAllPending: (userToken?: string) => Promise<void>
  
  // Funções utilitárias
  getPhotosByStatus: (status: OptimisticPhoto['sync_status']) => OptimisticPhoto[]
  getPendingSyncCount: () => number
}

export function useOptimisticPhotos(): UseOptimisticPhotosReturn {
  const [optimisticPhotos, setOptimisticPhotos] = useState<OptimisticPhoto[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Adicionar foto otimista
  const addOptimisticPhoto = useCallback((photoData: Omit<OptimisticPhoto, 'id' | 'sync_status' | 'created_at' | 'updated_at' | 'likes_count' | 'comments_count' | 'shares_count' | 'views_count'>): string => {
    const localId = `optimistic_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const timestamp = new Date().toISOString()
    
    const newPhoto: OptimisticPhoto = {
      ...photoData,
      id: localId,
      sync_status: 'optimistic',
      created_at: timestamp,
      updated_at: timestamp,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      views_count: 0,
      retry_count: 0
    }
    
    setOptimisticPhotos(prev => [newPhoto, ...prev])
    
    console.log('📸 [Optimistic] Foto adicionada ao estado local:', localId)
    return localId
  }, [])

  // Atualizar status da foto
  const updatePhotoStatus = useCallback((localId: string, status: OptimisticPhoto['sync_status'], remoteId?: string, errorMessage?: string) => {
    setOptimisticPhotos(prev => prev.map(photo => {
      if (photo.id === localId) {
        const updatedPhoto = {
          ...photo,
          sync_status: status,
          updated_at: new Date().toISOString(),
          ...(remoteId && { remote_id: remoteId }),
          ...(errorMessage && { error_message: errorMessage }),
          ...(status === 'error' && { retry_count: (photo.retry_count || 0) + 1 })
        }
        
        console.log(`📸 [Optimistic] Status atualizado para ${localId}: ${status}`)
        return updatedPhoto
      }
      return photo
    }))
  }, [])

  // Remover foto otimista
  const removeOptimisticPhoto = useCallback((localId: string) => {
    setOptimisticPhotos(prev => prev.filter(photo => photo.id !== localId))
    console.log('📸 [Optimistic] Foto removida do estado local:', localId)
  }, [])

  // Limpar todas as fotos otimistas
  const clearOptimisticPhotos = useCallback(() => {
    setOptimisticPhotos([])
    console.log('📸 [Optimistic] Estado local limpo')
  }, [])

  // Sincronizar foto específica com o servidor
  const syncPhotoToServer = useCallback(async (localId: string, userToken?: string) => {
    const photo = optimisticPhotos.find(p => p.id === localId)
    if (!photo) {
      console.warn('📸 [Optimistic] Foto não encontrada para sincronização:', localId)
      return
    }

    // Marcar como sincronizando
    updatePhotoStatus(localId, 'syncing')

    try {
      console.log('📸 [Optimistic] Sincronizando com servidor:', localId)

      const feedData = {
        imgur_id: photo.imgur_id,
        imgur_url: photo.imgur_url,
        imgur_page_url: photo.imgur_page_url,
        imgur_delete_url: photo.imgur_delete_url,
        width: photo.width,
        height: photo.height,
        file_size: photo.file_size,
        mime_type: 'image/jpeg',
        original_filename: photo.original_filename,
        title: photo.title,
        description: photo.description,
        tags: photo.tags,
        is_public: true,
        ...(userToken && { user_token: userToken })
      }

      const response = await fetch('/api/photos/save-feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao sincronizar foto')
      }

      // Marcar como sincronizada
      updatePhotoStatus(localId, 'synced', result.data.id)
      
      toast.success('📸 Foto sincronizada com sucesso!', {
        description: `"${photo.title}" foi salva no banco de dados.`
      })

      console.log('✅ [Optimistic] Foto sincronizada com sucesso:', {
        localId,
        remoteId: result.data.id,
        title: photo.title
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('❌ [Optimistic] Erro na sincronização:', errorMessage)
      
      updatePhotoStatus(localId, 'error', undefined, errorMessage)
      
      toast.error('❌ Erro ao sincronizar foto', {
        description: `"${photo.title}": ${errorMessage}`
      })
    }
  }, [optimisticPhotos, updatePhotoStatus])

  // Retentar sincronização de foto com falha
  const retryFailedSync = useCallback(async (localId: string, userToken?: string) => {
    const photo = optimisticPhotos.find(p => p.id === localId)
    if (!photo || photo.sync_status !== 'error') {
      console.warn('📸 [Optimistic] Foto não encontrada ou não está em estado de erro:', localId)
      return
    }

    if ((photo.retry_count || 0) >= 3) {
      toast.error('❌ Máximo de tentativas atingido', {
        description: `"${photo.title}" falhou após 3 tentativas.`
      })
      return
    }

    console.log(`📸 [Optimistic] Retentativa ${(photo.retry_count || 0) + 1}/3:`, localId)
    await syncPhotoToServer(localId, userToken)
  }, [optimisticPhotos, syncPhotoToServer])

  // Sincronizar todas as fotos pendentes
  const syncAllPending = useCallback(async (userToken?: string) => {
    const pendingPhotos = optimisticPhotos.filter(p => 
      p.sync_status === 'optimistic' || p.sync_status === 'error'
    )

    if (pendingPhotos.length === 0) {
      console.log('📸 [Optimistic] Nenhuma foto pendente para sincronização')
      return
    }

    console.log(`📸 [Optimistic] Sincronizando ${pendingPhotos.length} fotos pendentes`)
    setIsLoading(true)

    const syncPromises = pendingPhotos.map(photo => 
      syncPhotoToServer(photo.id, userToken)
    )

    try {
      await Promise.allSettled(syncPromises)
      console.log('✅ [Optimistic] Sincronização em lote concluída')
    } catch (error) {
      console.error('❌ [Optimistic] Erro na sincronização em lote:', error)
    } finally {
      setIsLoading(false)
    }
  }, [optimisticPhotos, syncPhotoToServer])

  // Obter fotos por status
  const getPhotosByStatus = useCallback((status: OptimisticPhoto['sync_status']) => {
    return optimisticPhotos.filter(photo => photo.sync_status === status)
  }, [optimisticPhotos])

  // Contar fotos pendentes de sincronização
  const getPendingSyncCount = useCallback(() => {
    return optimisticPhotos.filter(p => 
      p.sync_status === 'optimistic' || p.sync_status === 'syncing' || p.sync_status === 'error'
    ).length
  }, [optimisticPhotos])

  // Limpeza automática de fotos sincronizadas antigas (após 5 minutos)
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      
      setOptimisticPhotos(prev => {
        const filtered = prev.filter(photo => {
          if (photo.sync_status === 'synced') {
            const photoTime = new Date(photo.updated_at).getTime()
            return photoTime > fiveMinutesAgo
          }
          return true // Manter fotos não sincronizadas
        })
        
        if (filtered.length !== prev.length) {
          console.log(`📸 [Optimistic] ${prev.length - filtered.length} fotos sincronizadas antigas foram removidas`)
        }
        
        return filtered
      })
    }, 60000) // Verificar a cada minuto

    return () => clearInterval(interval)
  }, [])

  return {
    // Estado
    optimisticPhotos,
    isLoading,
    
    // Funções de manipulação
    addOptimisticPhoto,
    updatePhotoStatus,
    removeOptimisticPhoto,
    clearOptimisticPhotos,
    
    // Funções de sincronização
    syncPhotoToServer,
    retryFailedSync,
    syncAllPending,
    
    // Funções utilitárias
    getPhotosByStatus,
    getPendingSyncCount
  }
}
