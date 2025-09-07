import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface GooglePhotoLink {
  id: string
  user_id: string
  url: string
  title: string
  description?: string
  category?: string
  is_public: boolean
  likes_count: number
  views_count: number
  comments_count: number
  created_at: string
  updated_at: string
  user_name?: string
  user_username?: string
}

interface UseGooglePhotosLinksOptions {
  userId?: string
  publicOnly?: boolean
  limit?: number
  autoFetch?: boolean
}

export function useGooglePhotosLinks(options: UseGooglePhotosLinksOptions = {}) {
  const [links, setLinks] = useState<GooglePhotoLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const { 
    userId, 
    publicOnly = false, 
    limit = 20,
    autoFetch = true 
  } = options

  // Buscar links
  const fetchLinks = useCallback(async (reset: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      const currentOffset = reset ? 0 : offset
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
        ...(userId && { userId }),
        ...(publicOnly && { public: 'true' })
      })

      const response = await fetch(`/api/google-photos-links?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar links')
      }

      const newLinks = data.links || []
      
      if (reset) {
        setLinks(newLinks)
        setOffset(newLinks.length)
      } else {
        setLinks(prev => [...prev, ...newLinks])
        setOffset(prev => prev + newLinks.length)
      }

      setHasMore(newLinks.length === limit)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro ao buscar links:', err)
    } finally {
      setLoading(false)
    }
  }, [offset, userId, publicOnly, limit])

  // Adicionar novo link
  const addLink = useCallback(async (
    url: string, 
    title?: string, 
    description?: string, 
    category?: string,
    isPublic: boolean = true
  ) => {
    try {
      setLoading(true)

      const response = await fetch('/api/google-photos-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          title,
          description,
          category,
          isPublic
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao adicionar link')
      }

      // Adicionar o novo link ao início da lista
      setLinks(prev => [data.link, ...prev])
      toast.success(data.message || 'Link adicionado com sucesso!')
      
      return data.link

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar link'
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Remover link
  const removeLink = useCallback(async (linkId: string) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/google-photos-links?id=${linkId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover link')
      }

      // Remover da lista local
      setLinks(prev => prev.filter(link => link.id !== linkId))
      toast.success(data.message || 'Link removido com sucesso!')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover link'
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar mais links
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchLinks(false)
    }
  }, [loading, hasMore, fetchLinks])

  // Atualizar lista (reset)
  const refresh = useCallback(() => {
    setOffset(0)
    fetchLinks(true)
  }, [fetchLinks])

  // Buscar automaticamente na inicialização
  useEffect(() => {
    if (autoFetch) {
      fetchLinks(true)
    }
  }, [autoFetch, userId, publicOnly, limit]) // Removi fetchLinks das dependências para evitar loops

  // Estatísticas
  const stats = {
    total: links.length,
    byCategory: links.reduce((acc, link) => {
      if (link.category) {
        acc[link.category] = (acc[link.category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>),
    totalLikes: links.reduce((sum, link) => sum + link.likes_count, 0),
    totalViews: links.reduce((sum, link) => sum + link.views_count, 0)
  }

  return {
    links,
    loading,
    error,
    hasMore,
    stats,
    // Actions
    fetchLinks,
    addLink,
    removeLink,
    loadMore,
    refresh
  }
}
