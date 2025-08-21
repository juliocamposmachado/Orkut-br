'use client'

import { useEffect, useState } from 'react'
import { PostCard, Post } from "./PostCard"
import { CreatePost } from './CreatePost'
import { djOrkyService } from '@/lib/dj-orky-service'

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadPosts = () => {
    const storedPosts = JSON.parse(localStorage.getItem('orkut_posts') || '[]')
    // Garante que os posts mais recentes fiquem no topo
    storedPosts.sort((a: Post, b: Post) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    // manter no máximo 50 posts no feed
    setPosts(storedPosts.slice(0, 50))
    setIsLoading(false)
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
