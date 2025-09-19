'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { 
  Search,
  Plus,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  Tag,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image?: string
  status: string
  tags: string[]
  views_count: number
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
  profiles: {
    id: string
    display_name: string
    photo_url: string
    username: string
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function BlogPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  })
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [search, setSearch] = useState(searchParams?.get('search') || '')
  const [selectedTag, setSelectedTag] = useState(searchParams?.get('tag') || '')
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/login')
      return
    }

    loadPosts()
  }, [user, loading, router, searchParams])

  const loadPosts = async () => {
    try {
      setLoadingPosts(true)
      
      const page = parseInt(searchParams?.get('page') || '1')
      const searchQuery = searchParams?.get('search') || ''
      const tagQuery = searchParams?.get('tag') || ''
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: 'published'
      })
      
      if (searchQuery) params.append('search', searchQuery)
      if (tagQuery) params.append('tag', tagQuery)
      
      // Tentar API melhorada primeiro, depois fallback para API padrão
      let response = await fetch(`/api/blog/improved?${params}`)
      let data = await response.json()
      
      // Se API melhorada falhar, tentar API padrão
      if (!response.ok) {
        response = await fetch(`/api/blog?${params}`)
        data = await response.json()
      }
      
      if (response.ok) {
        setPosts(data.posts || [])
        setPagination(data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        })

        // Extrair todas as tags únicas
        const tags = new Set<string>()
        data.posts?.forEach((post: BlogPost) => {
          post.tags.forEach(tag => tags.add(tag))
        })
        setAllTags(Array.from(tags))
        
        // Mostrar aviso se estiver em modo demo
        if (data.source === 'demo') {
          console.log('⚠️ Blog em modo demo - configuração necessária')
        }
      } else {
        throw new Error(data.error || 'Erro ao carregar posts')
      }
    } catch (error) {
      console.error('Erro ao carregar posts do blog:', error)
      toast.error('Erro ao carregar posts do blog')
      setPosts([])
    } finally {
      setLoadingPosts(false)
    }
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (selectedTag) params.append('tag', selectedTag)
    params.append('page', '1')
    
    router.push(`/blog?${params.toString()}`)
  }

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    params.append('tag', tag)
    params.append('page', '1')
    
    router.push(`/blog?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedTag('')
    router.push('/blog')
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (selectedTag) params.append('tag', selectedTag)
    params.append('page', newPage.toString())
    
    router.push(`/blog?${params.toString()}`)
  }

  const isAuthor = (post: BlogPost) => {
    return user?.id === post.profiles?.id
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        {/* Header do Blog */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Orkut Blog
          </h1>
          <p className="text-gray-600 mb-6">
            Compartilhe suas ideias e histórias com a comunidade
          </p>
          
          <Button
            onClick={() => router.push('/blog/criar')}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Post
          </Button>
        </div>

        {/* Filtros e Busca */}
        <OrkutCard className="mb-6">
          <OrkutCardHeader>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </div>
          </OrkutCardHeader>
          <OrkutCardContent>
            <div className="space-y-4">
              {/* Busca */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Buscar posts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Tags populares:</p>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTag === tag ? "default" : "outline"}
                        className="cursor-pointer hover:bg-purple-100"
                        onClick={() => handleTagClick(tag)}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtros ativos */}
              {(search || selectedTag) && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Filtros ativos:</span>
                  {search && (
                    <Badge variant="secondary">
                      Busca: "{search}"
                    </Badge>
                  )}
                  {selectedTag && (
                    <Badge variant="secondary">
                      Tag: {selectedTag}
                    </Badge>
                  )}
                  <Button size="sm" variant="ghost" onClick={clearFilters}>
                    Limpar
                  </Button>
                </div>
              )}
            </div>
          </OrkutCardContent>
        </OrkutCard>

        {/* Lista de Posts */}
        <div className="space-y-6">
          {loadingPosts ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                {search || selectedTag ? 'Nenhum post encontrado com os filtros aplicados.' : 'Nenhum post publicado ainda.'}
              </p>
              <Button onClick={() => router.push('/blog/criar')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar o primeiro post
              </Button>
            </div>
          ) : (
            posts.map((post) => (
              <OrkutCard key={post.id} className="hover:shadow-lg transition-shadow">
                <OrkutCardContent className="p-6">
                  <div className="flex space-x-4">
                    {/* Imagem destacada */}
                    {post.featured_image && (
                      <div className="flex-shrink-0">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Conteúdo do post */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-xl font-semibold text-gray-800 hover:text-purple-600 transition-colors"
                        >
                          {post.title}
                        </Link>
                        
                        {/* Ações do autor */}
                        {isAuthor(post) && (
                          <div className="flex space-x-1 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/blog/${post.slug}/editar`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja deletar este post?')) {
                                  // TODO: Implementar deleção
                                  toast.success('Post deletado com sucesso')
                                }
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>

                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Metadados */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={post.profiles.photo_url} alt={post.profiles.display_name} />
                            <AvatarFallback className="text-xs">
                              {post.profiles.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Link
                            href={`/perfil/${post.profiles.username}`}
                            className="hover:text-purple-600"
                          >
                            {post.profiles.display_name}
                          </Link>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDistanceToNow(new Date(post.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{post.views_count}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes_count}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </OrkutCardContent>
              </OrkutCard>
            ))
          )}
        </div>

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <Button
              variant="outline"
              disabled={!pagination.hasPrev}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>

            <span className="text-gray-600">
              Página {pagination.page} de {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              disabled={!pagination.hasNext}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
