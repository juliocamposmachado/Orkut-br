'use client'

import { useEffect, useState } from 'react'
import { PostCard, Post } from "./PostCard"
import { CreatePost } from './CreatePost'
import { djOrkyService } from '@/lib/dj-orky-service'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { OrkutCard, OrkutCardContent } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Users, MessageCircle, Heart } from 'lucide-react'
import { toast } from 'sonner'

// Posts demo para quando não há posts reais
const demoPosts: Post[] = [
  {
    id: 'demo1',
    content: "🎉 Bem-vindos ao novo Orkut! Que saudade dessa sensação de rede social aconchegante! Este projeto está incrível, muito melhor que o original! 💜",
    author: "demo_user1",
    author_name: "Mariana Santos",
    author_photo: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100",
    visibility: "public",
    likes_count: 47,
    comments_count: 12,
    shares_count: 8,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    is_dj_post: false
  },
  {
    id: 'demo2',
    content: "Gente, por que o Google nunca trouxe o Orkut original de volta? 🤔 Ainda bem que temos essa versão incrível! Os recursos de voz e chamadas estão SENSACIONAIS! 👏",
    author: "demo_user2",
    author_name: "Carlos Eduardo",
    author_photo: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100",
    visibility: "public",
    likes_count: 89,
    comments_count: 23,
    shares_count: 15,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    is_dj_post: false
  },
  {
    id: 'demo3',
    content: "ESSE ORKUT ESTÁ PERFEITO! 😍 Muito melhor que o original! Tem tudo que a gente amava + recursos que nem sonhávamos em 2004. A rádio integrada é demais!",
    author: "demo_user3",
    author_name: "Ana Paula",
    author_photo: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100",
    visibility: "public",
    likes_count: 156,
    comments_count: 34,
    shares_count: 22,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    is_dj_post: false
  }
]

export function Feed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPosts = async () => {
    if (!user) {
      setPosts(demoPosts)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      console.log('🔄 Carregando posts da API...')
      
      const response = await fetch(`/api/posts-db${user ? `?user_id=${user.id}` : ''}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && Array.isArray(data.posts)) {
        console.log(`✅ ${data.posts.length} posts carregados (${data.source})`)
        
        const sortedPosts = data.posts.sort((a: Post, b: Post) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        // Se não há posts reais, usar demos + posts do DJ
        if (sortedPosts.length === 0 || sortedPosts.every((p: Post) => p.is_dj_post)) {
          setPosts([...sortedPosts, ...demoPosts])
        } else {
          setPosts(sortedPosts.slice(0, 50))
        }
      } else {
        console.warn('⚠️ API retornou formato inesperado')
        throw new Error('Formato de resposta inválido')
      }
    } catch (error) {
      console.error('❌ Erro ao carregar posts:', error)
      setError('Erro ao carregar posts')
      
      // Fallback: usar apenas posts demo
      setPosts(demoPosts)
      console.log('🎭 Usando posts demo como fallback')
    } finally {
      setIsLoading(false)
    }
  }

  // Inicializar DJ Orky e carregar posts
  useEffect(() => {
    const initialize = async () => {
      try {
        // Sempre inicializar DJ Orky se não estiver ativo
        console.log('🎵 Inicializando DJ Orky...')
        await djOrkyService.createInitialPosts()

        if (!djOrkyService.isActivePosting()) {
          djOrkyService.startAutoPosting()
        }
      } catch (error) {
        console.warn('⚠️ Erro ao inicializar DJ Orky:', error)
      }
      
      loadPosts()
    }

    initialize()

    // Listener para novos posts
    const handleNewPost = (event: Event) => {
      console.log('📨 Novo post criado!', (event as CustomEvent).detail)
      loadPosts()
    }

    window.addEventListener('new-post-created', handleNewPost)
    return () => window.removeEventListener('new-post-created', handleNewPost)
  }, [user])

  if (isLoading) {
    return (
      <OrkutCard>
        <OrkutCardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-3" />
              <p className="text-gray-600">Carregando feed...</p>
              <p className="text-xs text-gray-400 mt-1">Buscando as últimas postagens</p>
            </div>
          </div>
        </OrkutCardContent>
      </OrkutCard>
    )
  }

  if (error) {
    return (
      <OrkutCard>
        <OrkutCardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-3">❌ {error}</p>
            <Button 
              onClick={loadPosts} 
              variant="outline" 
              size="sm"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </OrkutCardContent>
      </OrkutCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Área para criar post */}
      <CreatePost onPostCreated={loadPosts} />
      
      {/* Feed de posts */}
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
          
          {/* Footer do feed */}
          <OrkutCard>
            <OrkutCardContent>
              <div className="text-center py-6 text-gray-500">
                <Users className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm mb-1">🎉 Você chegou ao final do feed!</p>
                <p className="text-xs">Que tal criar um novo post ou procurar por amigos?</p>
                <div className="flex justify-center space-x-2 mt-4">
                  <Button 
                    onClick={loadPosts} 
                    variant="outline" 
                    size="sm"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Atualizar
                  </Button>
                </div>
              </div>
            </OrkutCardContent>
          </OrkutCard>
        </div>
      ) : (
        <OrkutCard>
          <OrkutCardContent>
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-purple-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Seu feed está vazio!</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                Parece que você ainda não tem posts no seu feed. Que tal começar criando o seu primeiro post ou procurando por amigos?
              </p>
              <div className="flex justify-center space-x-3">
                <Button 
                  onClick={loadPosts}
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Feed
                </Button>
              </div>
            </div>
          </OrkutCardContent>
        </OrkutCard>
      )}
    </div>
  )
}
