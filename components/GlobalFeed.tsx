'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Globe, 
  Users, 
  RefreshCw, 
  ChevronDown,
  Music,
  Sparkles
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface GlobalFeedPost {
  id: number
  post_id: number
  author: string
  author_name: string
  author_photo: string | null
  content: string
  likes_count: number
  comments_count: number
  shares_count: number
  visibility: string
  is_dj_post: boolean
  created_at: string
  updated_at: string
}

interface GlobalFeedProps {
  className?: string
}

export function GlobalFeed({ className = '' }: GlobalFeedProps) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<GlobalFeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const loadFeed = useCallback(async (isRefresh = false, currentOffset = 0) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else if (currentOffset === 0) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const response = await fetch(`/api/global-feed?limit=20&offset=${currentOffset}`)
      const result = await response.json()

      if (result.success) {
        if (isRefresh || currentOffset === 0) {
          setPosts(result.posts)
          setOffset(20)
        } else {
          setPosts(prev => [...prev, ...result.posts])
          setOffset(prev => prev + result.posts.length)
        }
        
        setHasMore(result.hasMore)
        setError(null)
        console.log(`✅ Feed global carregado: ${result.posts.length} posts (total: ${result.total})`)
      } else {
        setError('Erro ao carregar feed')
        console.error('Erro ao carregar feed:', result.error)
      }
    } catch (error) {
      console.error('Erro ao carregar feed global:', error)
      setError('Erro de conexão')
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }, [])

  const handleLike = async (postId: number) => {
    if (!user) return

    try {
      // Otimistic update
      setPosts(prev => prev.map(post => 
        post.post_id === postId 
          ? { ...post, likes_count: post.likes_count + 1 }
          : post
      ))

      const response = await fetch('/api/posts-db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          action: 'like',
          user_id: user.id
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        // Reverter mudança otimista se falhar
        setPosts(prev => prev.map(post => 
          post.post_id === postId 
            ? { ...post, likes_count: post.likes_count - 1 }
            : post
        ))
        console.error('Erro ao curtir post:', result.error)
      }
    } catch (error) {
      console.error('Erro ao curtir post:', error)
      // Reverter mudança otimista
      setPosts(prev => prev.map(post => 
        post.post_id === postId 
          ? { ...post, likes_count: post.likes_count - 1 }
          : post
      ))
    }
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadFeed(false, offset)
    }
  }

  const handleRefresh = () => {
    loadFeed(true, 0)
  }

  useEffect(() => {
    loadFeed()
    
    // Escutar novos posts
    const handleNewPost = (event: any) => {
      console.log('📨 Novo post detectado, recarregando feed...')
      loadFeed(true, 0)
    }

    window.addEventListener('new-post-created', handleNewPost)
    
    // Auto-refresh a cada 2 minutos
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh do feed global')
      loadFeed(true, 0)
    }, 120000) // 2 minutos

    return () => {
      window.removeEventListener('new-post-created', handleNewPost)
      clearInterval(interval)
    }
  }, [loadFeed])

  if (loading && posts.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <OrkutCard>
          <OrkutCardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Feed Global</span>
              </div>
            </div>
          </OrkutCardHeader>
          <OrkutCardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-purple-600">Carregando feed global...</p>
            </div>
          </OrkutCardContent>
        </OrkutCard>
      </div>
    )
  }

  if (error && posts.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <OrkutCard>
          <OrkutCardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Feed Global</span>
              </div>
              <Button
                variant="ghost" 
                size="sm"
                onClick={handleRefresh}
                className="text-purple-600"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </OrkutCardHeader>
          <OrkutCardContent>
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Erro ao carregar feed</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} className="bg-purple-500 hover:bg-purple-600">
                Tentar novamente
              </Button>
            </div>
          </OrkutCardContent>
        </OrkutCard>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header do Feed */}
      <OrkutCard>
        <OrkutCardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              <span className="font-semibold">Feed Global</span>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {posts.length} posts
              </Badge>
            </div>
            <Button
              variant="ghost" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-purple-600"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </OrkutCardHeader>
      </OrkutCard>

      {/* Posts */}
      {posts.map((post) => (
        <OrkutCard key={post.id}>
          <OrkutCardContent className="p-4">
            <div className="space-y-4">
              {/* Header do Post */}
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author_photo || undefined} alt={post.author_name} />
                  <AvatarFallback>
                    {post.author_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-800">{post.author_name}</h3>
                    {post.is_dj_post && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        <Music className="h-3 w-3 mr-1" />
                        DJ Orky
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      <Globe className="h-3 w-3 mr-1" />
                      Público
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(post.created_at), { 
                      addSuffix: true,
                      locale: ptBR 
                    })}
                  </p>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="pl-13">
                <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pl-13 pt-2 border-t">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.post_id)}
                    className="text-gray-600 hover:text-red-500 hover:bg-red-50"
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    {post.likes_count}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-blue-500 hover:bg-blue-50"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {post.comments_count}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-green-500 hover:bg-green-50"
                  >
                    <Share className="h-4 w-4 mr-1" />
                    {post.shares_count}
                  </Button>
                </div>
                
                {post.is_dj_post && (
                  <div className="flex items-center text-blue-600">
                    <Sparkles className="h-4 w-4 mr-1" />
                    <span className="text-xs">Post do DJ</span>
                  </div>
                )}
              </div>
            </div>
          </OrkutCardContent>
        </OrkutCard>
      ))}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                Carregando...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Carregar mais posts
              </>
            )}
          </Button>
        </div>
      )}

      {/* No More Posts */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">Você viu todos os posts do feed global!</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <OrkutCard>
          <OrkutCardContent>
            <div className="text-center py-12">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Feed global vazio</h3>
              <p className="text-gray-600">Seja o primeiro a postar algo!</p>
            </div>
          </OrkutCardContent>
        </OrkutCard>
      )}
    </div>
  )
}
