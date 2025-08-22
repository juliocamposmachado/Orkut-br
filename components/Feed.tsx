'use client'

import { useEffect, useState } from 'react'
import { PostCard, Post } from "./PostCard"
import { CreatePost } from './CreatePost'
import { djOrkyService } from '@/lib/dj-orky-service'

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadPosts = async () => {
    try {
      console.log('🔄 Carregando posts da API global...')
      
      // Carregar posts da API global
      const response = await fetch('/api/posts-db', {
        method: 'GET',
        cache: 'no-store' // Sempre buscar dados frescos
      })
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar posts: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && Array.isArray(data.posts)) {
        console.log(`✅ ${data.posts.length} posts carregados da API global`)
        
        // Manter os posts ordenados por data (mais recente primeiro)
        const sortedPosts = data.posts.sort((a: Post, b: Post) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        setPosts(sortedPosts.slice(0, 50)) // Limitar a 50 posts
        
        // Também sincronizar com localStorage para compatibilidade
        localStorage.setItem('orkut_posts', JSON.stringify(sortedPosts))
      } else {
        console.warn('⚠️ API global retornou formato inesperado, usando localStorage como fallback')
        loadPostsFromLocalStorage()
      }
    } catch (error) {
      console.error('❌ Erro ao carregar posts da API global:', error)
      console.log('🔄 Usando localStorage como fallback...')
      loadPostsFromLocalStorage()
    } finally {
      setIsLoading(false)
    }
  }
  
  const loadPostsFromLocalStorage = () => {
    const storedPosts = JSON.parse(localStorage.getItem('orkut_posts') || '[]')
    // Garante que os posts mais recentes fiquem no topo
    storedPosts.sort((a: Post, b: Post) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    // manter no máximo 50 posts no feed
    setPosts(storedPosts.slice(0, 50))
  }

  useEffect(() => {
    // Carrega os posts iniciais e inicia o DJ Orky se necessário
    const initialize = async () => {
      const storedPosts = JSON.parse(localStorage.getItem('orkut_posts') || '[]')
      const hasDjPosts = storedPosts.some((p: Post) => p.is_dj_post)
      
      if (!hasDjPosts) {
        await djOrkyService.createInitialPosts()
      }

      if (!djOrkyService.isActivePosting()) {
        djOrkyService.startAutoPosting()
      }

      loadPosts()
    }

    initialize()

    // Listener para novos posts
    const handleNewPost = (event: Event) => {
      console.log('Novo post recebido!', (event as CustomEvent).detail)
      loadPosts() // Recarrega todos os posts para garantir a ordem
    }

    window.addEventListener('new-post-created', handleNewPost)

    return () => {
      window.removeEventListener('new-post-created', handleNewPost)
    }
  }, [])

  if (isLoading) {
    return <div>Carregando feed...</div>
  }

  return (
    <div>
      <CreatePost onPostCreated={loadPosts} />
      <div className="mt-6">
        {posts.length > 0 ? (
          posts.slice(0, 50).map(post => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <p>Nenhuma publicação no feed ainda. Que tal começar?</p>
        )}
      </div>
    </div>
  )
}
