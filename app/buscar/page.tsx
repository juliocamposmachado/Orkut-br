'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context-fallback'
import { Navbar } from '@/components/layout/navbar'
import { OrkyAssistant } from '@/components/voice/orky-assistant'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { 
  Search, 
  Users, 
  MessageCircle, 
  FileText,
  TrendingUp,
  UserPlus,
  Eye,
  Star,
  Clock,
  Filter
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'user' | 'community' | 'post'
  title: string
  subtitle: string
  description?: string
  image?: string
  metadata?: any
  relevance: number
}

interface User {
  id: string
  username: string
  display_name: string
  photo_url: string | null
  bio: string | null
  location: string | null
}

interface Community {
  id: number
  name: string
  description: string
  photo_url: string
  members_count: number
  category: string
}

interface Post {
  id: number
  content: string
  created_at: string
  author: {
    id: string
    display_name: string
    photo_url: string
  }
}

export default function SearchPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams?.get('q') || ''
  
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [users, setUsers] = useState<User[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [trendingTopics, setTrendingTopics] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadTrendingTopics()
      loadRecentSearches()
      
      if (initialQuery) {
        performSearch(initialQuery)
      }
    }
  }, [user, loading, router, initialQuery])

  const loadTrendingTopics = async () => {
    // Simulated trending topics - in a real app, these would come from analytics
    setTrendingTopics([
      'nostalgia',
      'amizade',
      'música dos anos 2000',
      'tecnologia',
      'jogos retrô',
      'filmes clássicos',
      'receitas',
      'viagem'
    ])
  }

  const loadRecentSearches = () => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
    setRecentSearches(recent.slice(0, 5))
  }

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return
    
    const recent: string[] = JSON.parse(localStorage.getItem('recentSearches') || '[]')
    const updated = [query, ...recent.filter((item: string) => item !== query)].slice(0, 10)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
    setRecentSearches(updated.slice(0, 5))
  }

  const performSearch = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    setHasSearched(true)
    saveRecentSearch(query)

    try {
      // Search users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, display_name, photo_url, bio, location')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,bio.ilike.%${query}%`)
        .neq('id', user?.id)
        .limit(20)

      if (usersError) throw usersError
      setUsers(usersData || [])

      // Search communities
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(20)

      if (communitiesError) throw communitiesError
      setCommunities(communitiesData || [])

      // Search posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author(id, display_name, photo_url)
        `)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (postsError) throw postsError
      
      const transformedPosts = postsData?.map(post => ({
        ...post,
        author: post.profiles as any
      })) || []

      setPosts(transformedPosts)

    } catch (error) {
      console.error('Error performing search:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Update URL with search query
      router.push(`/buscar?q=${encodeURIComponent(searchQuery)}`)
      performSearch(searchQuery)
    }
  }

  const handleTrendingClick = (topic: string) => {
    setSearchQuery(topic)
    router.push(`/buscar?q=${encodeURIComponent(topic)}`)
    performSearch(topic)
  }

  const handleRecentClick = (query: string) => {
    setSearchQuery(query)
    router.push(`/buscar?q=${encodeURIComponent(query)}`)
    performSearch(query)
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

  const totalResults = users.length + communities.length + posts.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Buscar</h1>
          <p className="text-gray-600">Encontre pessoas, comunidades e conteúdo</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Busque por pessoas, comunidades, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-4 text-lg border-purple-300 focus:ring-purple-500 rounded-xl"
            />
            <Button 
              type="submit"
              className="absolute right-2 top-2 bg-purple-500 hover:bg-purple-600"
              disabled={isSearching}
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar */}
          <div className="space-y-6">
            
            {/* Search Stats */}
            {hasSearched && (
              <OrkutCard>
                <OrkutCardHeader>
                  <span>Resultados</span>
                </OrkutCardHeader>
                <OrkutCardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pessoas:</span>
                      <Badge variant="outline">{users.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Comunidades:</span>
                      <Badge variant="outline">{communities.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Posts:</span>
                      <Badge variant="outline">{posts.length}</Badge>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Total:</span>
                        <Badge className="bg-purple-500">{totalResults}</Badge>
                      </div>
                    </div>
                  </div>
                </OrkutCardContent>
              </OrkutCard>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <OrkutCard>
                <OrkutCardHeader>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Buscas Recentes</span>
                  </div>
                </OrkutCardHeader>
                <OrkutCardContent>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentClick(search)}
                        className="block w-full text-left text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 p-2 rounded transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </OrkutCardContent>
              </OrkutCard>
            )}

            {/* Trending Topics */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Tópicos em Alta</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="flex flex-wrap gap-2">
                  {trendingTopics.map((topic, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTrendingClick(topic)}
                      className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      #{topic}
                    </Button>
                  ))}
                </div>
              </OrkutCardContent>
            </OrkutCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            
            {!hasSearched ? (
              <OrkutCard>
                <OrkutCardContent>
                  <div className="text-center py-16">
                    <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-800 mb-2">
                      Descubra pessoas e conteúdo incrível
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Use a busca para encontrar amigos, comunidades interessantes e posts relevantes.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {trendingTopics.slice(0, 4).map((topic, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={() => handleTrendingClick(topic)}
                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          Buscar "{topic}"
                        </Button>
                      ))}
                    </div>
                  </div>
                </OrkutCardContent>
              </OrkutCard>
            ) : isSearching ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-purple-600">Buscando por "{searchQuery}"...</p>
              </div>
            ) : totalResults === 0 ? (
              <OrkutCard>
                <OrkutCardContent>
                  <div className="text-center py-16">
                    <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-800 mb-2">
                      Nenhum resultado encontrado
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Não encontramos nada para "{searchQuery}". Tente outros termos ou explore os tópicos em alta.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {trendingTopics.slice(0, 3).map((topic, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={() => handleTrendingClick(topic)}
                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          Tentar "{topic}"
                        </Button>
                      ))}
                    </div>
                  </div>
                </OrkutCardContent>
              </OrkutCard>
            ) : (
              <Tabs defaultValue="all" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Todos ({totalResults})</TabsTrigger>
                  <TabsTrigger value="users">Pessoas ({users.length})</TabsTrigger>
                  <TabsTrigger value="communities">Comunidades ({communities.length})</TabsTrigger>
                  <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
                </TabsList>

                {/* All Results Tab */}
                <TabsContent value="all" className="space-y-6">
                  
                  {/* Users Section */}
                  {users.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Pessoas ({users.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {users.slice(0, 4).map((user) => (
                          <OrkutCard key={user.id}>
                            <OrkutCardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={user.photo_url || undefined} alt={user.display_name} />
                                  <AvatarFallback>{user.display_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-800 truncate">{user.display_name}</h4>
                                  <p className="text-sm text-gray-600">@{user.username}</p>
                                  {user.location && (
                                    <p className="text-xs text-gray-500">{user.location}</p>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <Link href={`/perfil/${user.username}`}>
                                    <Button size="sm" variant="outline" className="border-purple-300 text-purple-700">
                                      <Eye className="h-3 w-3 mr-1" />
                                      Ver
                                    </Button>
                                  </Link>
                                  <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    Adicionar
                                  </Button>
                                </div>
                              </div>
                            </OrkutCardContent>
                          </OrkutCard>
                        ))}
                      </div>
                      {users.length > 4 && (
                        <Button variant="outline" className="w-full border-purple-300 text-purple-700">
                          Ver todas as {users.length} pessoas
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Communities Section */}
                  {communities.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Comunidades ({communities.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {communities.slice(0, 4).map((community) => (
                          <OrkutCard key={community.id}>
                            <OrkutCardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <img 
                                  src={community.photo_url} 
                                  alt={community.name}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-800 truncate">{community.name}</h4>
                                  <p className="text-sm text-gray-600 line-clamp-1">{community.description}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {community.category}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {community.members_count} membros
                                    </span>
                                  </div>
                                </div>
                                <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                                  Entrar
                                </Button>
                              </div>
                            </OrkutCardContent>
                          </OrkutCard>
                        ))}
                      </div>
                      {communities.length > 4 && (
                        <Button variant="outline" className="w-full border-purple-300 text-purple-700">
                          Ver todas as {communities.length} comunidades
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Posts Section */}
                  {posts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Posts ({posts.length})
                      </h3>
                      <div className="space-y-4">
                        {posts.slice(0, 3).map((post) => (
                          <OrkutCard key={post.id}>
                            <OrkutCardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={post.author.photo_url} alt={post.author.display_name} />
                                  <AvatarFallback>{post.author.display_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="font-medium text-gray-800">{post.author.display_name}</span>
                                    <span className="text-sm text-gray-500">
                                      {new Date(post.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 line-clamp-3">{post.content}</p>
                                </div>
                              </div>
                            </OrkutCardContent>
                          </OrkutCard>
                        ))}
                      </div>
                      {posts.length > 3 && (
                        <Button variant="outline" className="w-full border-purple-300 text-purple-700">
                          Ver todos os {posts.length} posts
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Individual tabs for each type */}
                <TabsContent value="users" className="space-y-4">
                  {users.length === 0 ? (
                    <OrkutCard>
                      <OrkutCardContent>
                        <div className="text-center py-12">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhuma pessoa encontrada</h3>
                          <p className="text-gray-600">Tente usar outros termos de busca.</p>
                        </div>
                      </OrkutCardContent>
                    </OrkutCard>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {users.map((user) => (
                        <OrkutCard key={user.id}>
                          <OrkutCardContent className="p-4 text-center">
                            <Avatar className="h-16 w-16 mx-auto mb-3">
                              <AvatarImage src={user.photo_url || undefined} alt={user.display_name} />
                              <AvatarFallback>{user.display_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <h4 className="font-medium text-gray-800 mb-1">{user.display_name}</h4>
                            <p className="text-sm text-gray-600 mb-2">@{user.username}</p>
                            {user.bio && (
                              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{user.bio}</p>
                            )}
                            {user.location && (
                              <p className="text-xs text-gray-400 mb-3">{user.location}</p>
                            )}
                            <div className="flex space-x-2">
                              <Link href={`/perfil/${user.username}`} className="flex-1">
                                <Button size="sm" variant="outline" className="w-full border-purple-300 text-purple-700">
                                  Ver Perfil
                                </Button>
                              </Link>
                              <Button size="sm" className="flex-1 bg-purple-500 hover:bg-purple-600">
                                Adicionar
                              </Button>
                            </div>
                          </OrkutCardContent>
                        </OrkutCard>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="communities" className="space-y-4">
                  {communities.length === 0 ? (
                    <OrkutCard>
                      <OrkutCardContent>
                        <div className="text-center py-12">
                          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhuma comunidade encontrada</h3>
                          <p className="text-gray-600">Tente usar outros termos de busca.</p>
                        </div>
                      </OrkutCardContent>
                    </OrkutCard>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {communities.map((community) => (
                        <OrkutCard key={community.id}>
                          <div className="relative">
                            <img 
                              src={community.photo_url} 
                              alt={community.name}
                              className="w-full h-32 object-cover rounded-t-lg"
                            />
                            <Badge variant="secondary" className="absolute top-2 right-2 bg-white/90">
                              {community.category}
                            </Badge>
                          </div>
                          <OrkutCardContent className="p-4">
                            <h4 className="font-medium text-gray-800 mb-2">{community.name}</h4>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{community.description}</p>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {community.members_count.toLocaleString('pt-BR')} membros
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-600">4.8</span>
                              </div>
                            </div>
                            <Button className="w-full bg-purple-500 hover:bg-purple-600">
                              Entrar na Comunidade
                            </Button>
                          </OrkutCardContent>
                        </OrkutCard>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="posts" className="space-y-4">
                  {posts.length === 0 ? (
                    <OrkutCard>
                      <OrkutCardContent>
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum post encontrado</h3>
                          <p className="text-gray-600">Tente usar outros termos de busca.</p>
                        </div>
                      </OrkutCardContent>
                    </OrkutCard>
                  ) : (
                    posts.map((post) => (
                      <OrkutCard key={post.id}>
                        <OrkutCardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={post.author.photo_url} alt={post.author.display_name} />
                              <AvatarFallback>{post.author.display_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-medium text-gray-800">{post.author.display_name}</span>
                                <span className="text-sm text-gray-500">
                                  {new Date(post.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-3">{post.content}</p>
                              <div className="flex space-x-4">
                                <Button size="sm" variant="ghost" className="text-purple-600 hover:bg-purple-50">
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  Comentar
                                </Button>
                                <Button size="sm" variant="ghost" className="text-purple-600 hover:bg-purple-50">
                                  <Star className="h-4 w-4 mr-1" />
                                  Curtir
                                </Button>
                              </div>
                            </div>
                          </div>
                        </OrkutCardContent>
                      </OrkutCard>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>

      <OrkyAssistant />
    </div>
  )
}
