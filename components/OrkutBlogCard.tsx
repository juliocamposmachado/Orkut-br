'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen,
  Plus,
  Calendar,
  Eye,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image?: string
  tags: string[]
  views_count: number
  likes_count: number
  created_at: string
  profiles: {
    id: string
    display_name: string
    photo_url: string
    username: string
  }
}

export function OrkutBlogCard() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentPosts()
  }, [])

  const loadRecentPosts = async () => {
    try {
      const response = await fetch('/api/blog?limit=3&status=published')
      const data = await response.json()
      
      if (response.ok) {
        setPosts(data.posts || [])
      } else {
        console.error('Erro ao carregar posts:', data.error)
      }
    } catch (error) {
      console.error('Erro ao buscar posts do blog:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <OrkutCard>
        <OrkutCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium text-gray-600">Orkut Blog</span>
            </div>
            <span className="text-xs text-gray-400">Artigos</span>
          </div>
        </OrkutCardHeader>
        <OrkutCardContent>
          <div className="text-center py-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Carregando posts...</p>
          </div>
        </OrkutCardContent>
      </OrkutCard>
    )
  }

  return (
    <OrkutCard>
      <OrkutCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium text-gray-600">Orkut Blog</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-xs text-gray-400">Recentes</span>
          </div>
        </div>
      </OrkutCardHeader>
      <OrkutCardContent>
        {posts.length === 0 ? (
          <div className="text-center py-6">
            <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">
              Nenhum post publicado ainda.
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
              onClick={() => router.push('/blog/criar')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro post
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post, index) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <div className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                  index === 0 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100' 
                    : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100'
                }`}>
                  <div className="flex items-start space-x-2 mb-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                      index === 0 ? 'bg-blue-500' : 'bg-purple-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 mb-1">
                        <span className={`text-sm font-medium ${
                          index === 0 ? 'text-blue-700' : 'text-purple-700'
                        }`}>
                          {index === 0 ? 'Em Destaque' : 'Recente'}
                        </span>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            <Eye className="h-2 w-2 mr-1" />
                            {post.views_count}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-sm text-gray-800 mb-1 line-clamp-2">
                        {post.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {post.excerpt}
                      </p>
                      
                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {post.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                              #{tag}
                            </Badge>
                          ))}
                          {post.tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{post.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                      
                      {/* Metadados */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(post.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          por {post.profiles.display_name.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Botão para ver todos */}
            <div className="pt-2 border-t border-gray-100">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 text-xs"
                onClick={() => router.push('/blog')}
              >
                <BookOpen className="h-3 w-3 mr-2" />
                Ver todos os posts
              </Button>
              
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-full text-purple-600 hover:bg-purple-50 text-xs mt-1"
                onClick={() => router.push('/blog/criar')}
              >
                <Plus className="h-3 w-3 mr-2" />
                Escrever novo post
              </Button>
            </div>
          </div>
        )}
      </OrkutCardContent>
    </OrkutCard>
  )
}
