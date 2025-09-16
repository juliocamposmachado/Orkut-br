'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { supabase } from '@/lib/supabase'
export interface Photo {
  id: string
  user_id: string
  url: string
  thumbnail_url?: string
  preview_url?: string
  title: string
  description?: string
  category?: string
  likes_count: number
  comments_count: number
  views_count: number
  created_at: string
  user_name: string
  user_avatar?: string
}

export interface PhotoFilters {
  userId?: string
  category?: string
  search?: string
  limit?: number
  offset?: number
  publicOnly?: boolean
}

export interface PhotoStats {
  total: number
  categories: Record<string, number>
  public: number
  private: number
}

export interface UsePhotosResult {
  photos: Photo[]
  loading: boolean
  error: string | null
  stats: PhotoStats | null
  popularCategories: { category: string; count: number }[]
  pagination: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
  // Actions
  fetchPhotos: (filters?: PhotoFilters) => Promise<void>
  loadMore: () => Promise<void>
  refreshPhotos: () => Promise<void>
  likePhoto: (photoId: string) => Promise<boolean>
  incrementViews: (photoId: string) => Promise<void>
  // State
  filters: PhotoFilters
  setFilters: (filters: PhotoFilters) => void
  clearFilters: () => void
}

// Cache global para fotos (compartilhado entre componentes)
const photoCache = new Map<string, { data: any; expires: number }>()
const CACHE_DURATION = 3 * 60 * 1000 // 3 minutos

function getCachedPhotos(key: string) {
  const cached = photoCache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  photoCache.delete(key)
  return null
}

function setCachedPhotos(key: string, data: any, duration = CACHE_DURATION) {
  photoCache.set(key, {
    data,
    expires: Date.now() + duration
  })
}

export function usePhotos(initialFilters: PhotoFilters = {}): UsePhotosResult {
  const { user } = useAuth()
  
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<PhotoStats | null>(null)
  const [popularCategories, setPopularCategories] = useState<{ category: string; count: number }[]>([])
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false
  })
  const [filters, setFiltersState] = useState<PhotoFilters>({
    limit: 20,
    offset: 0,
    publicOnly: true,
    ...initialFilters
  })

  // Refs para evitar re-renders desnecessários
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastFetchRef = useRef<string>('')

  /**
   * Função principal para buscar fotos
   */
  const fetchPhotos = useCallback(async (newFilters?: PhotoFilters, append = false) => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const currentFilters = { ...filters, ...newFilters }
    const cacheKey = JSON.stringify(currentFilters)
    
    // Evitar requisições duplicadas
    if (lastFetchRef.current === cacheKey && !append) {
      return
    }

    setLoading(true)
    setError(null)

    // Verificar cache primeiro
    const cachedData = getCachedPhotos(cacheKey)
    if (cachedData && !append) {
      setPhotos(cachedData.photos)
      setStats(cachedData.stats)
      setPopularCategories(cachedData.popularCategories || [])
      setPagination(cachedData.pagination)
      setLoading(false)
      return
    }

    try {
      abortControllerRef.current = new AbortController()
      
      // Construir URL com parâmetros
      const params = new URLSearchParams()
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      // Headers com autenticação se disponível
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (user) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
      }

      const response = await fetch(`/api/photos?${params.toString()}`, {
        headers,
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Verificar se está em modo demo e mostrar aviso
      if (data.demo && typeof window !== 'undefined') {
        console.warn('🔄 [DEMO MODE] Sistema de fotos em modo demonstração')
        console.info('💡 Para funcionalidade completa, configure o Supabase')
      }

      if (append && currentFilters.offset! > 0) {
        // Adicionar fotos à lista existente (loadMore)
        setPhotos(prev => [...prev, ...data.photos])
      } else {
        // Substituir fotos (nova busca)
        setPhotos(data.photos)
      }

      setStats(data.stats)
      setPopularCategories(data.popularCategories || [])
      setPagination(data.pagination)

      // Cachear apenas se não for append
      if (!append) {
        setCachedPhotos(cacheKey, data)
      }

      lastFetchRef.current = cacheKey

    } catch (err: any) {
      if (err.name === 'AbortError') return
      
      console.error('Erro ao buscar fotos:', err)
      setError(err.message || 'Erro ao carregar fotos')
    } finally {
      setLoading(false)
    }
  }, [filters, user])

  /**
   * Carregar mais fotos (paginação)
   */
  const loadMore = useCallback(async () => {
    if (loading || !pagination.hasMore) return

    const nextOffset = pagination.offset + pagination.limit
    await fetchPhotos({ ...filters, offset: nextOffset }, true)
  }, [filters, pagination, loading, fetchPhotos])

  /**
   * Atualizar filtros
   */
  const setFilters = useCallback((newFilters: PhotoFilters) => {
    setFiltersState(prev => ({ ...prev, ...newFilters, offset: 0 }))
  }, [])

  /**
   * Limpar filtros
   */
  const clearFilters = useCallback(() => {
    setFiltersState({
      limit: 20,
      offset: 0,
      publicOnly: true
    })
  }, [])

  /**
   * Refresh forçado
   */
  const refreshPhotos = useCallback(async () => {
    // Limpar cache
    photoCache.clear()
    lastFetchRef.current = ''
    await fetchPhotos(filters)
  }, [fetchPhotos, filters])

  /**
   * Curtir/descurtir foto
   */
  const likePhoto = useCallback(async (photoId: string): Promise<boolean> => {
    if (!user) {
      setError('Login necessário para curtir fotos')
      return false
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Sessão expirada')
      }

      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          photoId,
          action: 'like'
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao curtir foto')
      }

      const result = await response.json()
      
      // Atualizar foto localmente
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId 
          ? { 
              ...photo, 
              likes_count: result.action === 'like_added' 
                ? photo.likes_count + 1 
                : Math.max(0, photo.likes_count - 1)
            }
          : photo
      ))

      // Limpar cache para refresh
      photoCache.clear()

      return result.action === 'like_added'

    } catch (err: any) {
      console.error('Erro ao curtir foto:', err)
      setError(err.message)
      return false
    }
  }, [user])

  /**
   * Incrementar visualizações
   */
  const incrementViews = useCallback(async (photoId: string) => {
    try {
      // Requisição assíncrona para não bloquear UI
      fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId,
          action: 'view'
        })
      }).catch(err => console.warn('Erro ao incrementar views:', err))

      // Atualizar localmente (otimistic update)
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId 
          ? { ...photo, views_count: photo.views_count + 1 }
          : photo
      ))

    } catch (err) {
      console.warn('Erro ao incrementar views:', err)
    }
  }, [])

  // Efeito para buscar fotos quando filtros mudarem
  useEffect(() => {
    fetchPhotos(filters)
  }, [filters.userId, filters.category, filters.search, filters.publicOnly, user])

  // Prefetch de categorias populares no mount
  useEffect(() => {
    if (popularCategories.length === 0) {
      fetch('/api/photos?limit=1')
        .then(res => res.json())
        .then(data => {
          if (data.popularCategories) {
            setPopularCategories(data.popularCategories)
          }
        })
        .catch(err => console.warn('Erro no prefetch:', err))
    }
  }, [])

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    photos,
    loading,
    error,
    stats,
    popularCategories,
    pagination,
    fetchPhotos: (newFilters) => fetchPhotos(newFilters),
    loadMore,
    refreshPhotos,
    likePhoto,
    incrementViews,
    filters,
    setFilters,
    clearFilters
  }
}
