'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Navbar } from '@/components/layout/navbar'
import { OrkyAssistant } from '@/components/voice/orky-assistant'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Users, 
  Calendar,
  TrendingUp,
  Star,
  Camera,
  Phone,
  Video
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Post {
  id: number
  content: string
  created_at: string
  likes_count: number
  comments_count: number
  author: {
    id: string
    display_name: string
    photo_url: string
    username: string
  }
}

interface Community {
  id: number
  name: string
  photo_url: string
  members_count: number
  category: string
}

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadFeed()
      loadCommunities()
    }
  }, [user, loading, router])

  const loadFeed = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author (
            id,
            display_name,
            photo_url,
            username
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // Transform the data to match our interface
      const transformedPosts = data?.map(post => ({
        ...post,
        author: post.profiles as any
      })) || []

      setPosts(transformedPosts)
    } catch (error) {
      console.error('Error loading feed:', error)
    } finally {
      setLoadingPosts(false)
    }
  }

  const loadCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('members_count', { ascending: false })
        .limit(6)

      if (error) throw error
      setCommunities(data || [])
    } catch (error) {
      console.error('Error loading communities:', error)
    }
  }

  const handleLike = async (postId: number) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('likes')
        .upsert({ 
          post_id: postId, 
          profile_id: user.id 
        })

      if (!error) {
        // Update local state
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: post.likes_count + 1 }
            : post
        ))
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
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
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <OrkutCard variant="gradient">
              <div className="p-4 text-center">
                <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-white">
                  <AvatarImage src={profile.photo_url} alt={profile.display_name} />
                  <AvatarFallback>
                    {profile.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-gray-800 mb-1">{profile.display_name}</h3>
                <p className="text-sm text-gray-600 mb-3">@{profile.username}</p>
                <Badge variant="secondary" className="mb-3">
                  {profile.relationship || 'Solteiro(a)'}
                </Badge>
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Chamada de Áudio
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Chamada de Vídeo
                  </Button>
                </div>
              </div>
            </OrkutCard>

            {/* Birthdays */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Aniversários</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-2">
                    🎂 Hoje é aniversário do Paulo!
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Ele faz 55 anos
                  </p>
                  <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                    Parabenizar
                  </Button>
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* Recent Photos */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Camera className="h-4 w-4" />
                  <span>Fotos Recentes</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="aspect-square bg-gray-200 rounded-md overflow-hidden">
                      <img 
                        src={`https://images.pexels.com/photos/${1000000 + idx}/pexels-photo-${1000000 + idx}.jpeg?auto=compress&cs=tinysrgb&w=100`}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </OrkutCardContent>
            </OrkutCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Composer */}
            <OrkutCard>
              <OrkutCardContent>
                <div className="flex space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.photo_url} alt={profile.display_name} />
                    <AvatarFallback>
                      {profile.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <textarea
                      placeholder="O que você está pensando?"
                      className="w-full p-3 border border-purple-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          📷 Foto
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          📍 Local
                        </Button>
                      </div>
                      <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                        Publicar
                      </Button>
                    </div>
                  </div>
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* Feed Posts */}
            {loadingPosts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-purple-600">Carregando feed...</p>
              </div>
            ) : posts.length === 0 ? (
              <OrkutCard>
                <OrkutCardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      Seu feed está vazio! Que tal seguir alguns amigos ou comunidades?
                    </p>
                    <Button 
                      className="bg-purple-500 hover:bg-purple-600"
                      onClick={() => router.push('/buscar')}
                    >
                      Buscar Pessoas
                    </Button>
                  </div>
                </OrkutCardContent>
              </OrkutCard>
            ) : (
              posts.map((post) => (
                <OrkutCard key={post.id}>
                  <OrkutCardContent>
                    <div className="flex space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author?.photo_url} alt={post.author?.display_name} />
                        <AvatarFallback>
                          {post.author?.display_name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-800">
                            {post.author?.display_name}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(post.created_at), { 
                              addSuffix: true,
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{post.content}</p>
                        <div className="flex items-center space-x-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleLike(post.id)}
                            className="text-purple-600 hover:bg-purple-50"
                          >
                            <Heart className="h-4 w-4 mr-1" />
                            {post.likes_count || 0}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-purple-600 hover:bg-purple-50"
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {post.comments_count || 0}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-purple-600 hover:bg-purple-50"
                          >
                            <Share className="h-4 w-4 mr-1" />
                            Compartilhar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </OrkutCardContent>
                </OrkutCard>
              ))
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Communities in Spotlight */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Comunidades em Alta</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-3">
                  {communities.slice(0, 5).map((community) => (
                    <div key={community.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
                      <img 
                        src={community.photo_url} 
                        alt={community.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-800 truncate">
                          {community.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {community.members_count.toLocaleString('pt-BR')} membros
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3 border-purple-300 text-purple-700 hover:bg-purple-50"
                  onClick={() => router.push('/comunidades')}
                >
                  Ver Todas
                </Button>
              </OrkutCardContent>
            </OrkutCard>

            {/* My Communities */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Minhas Comunidades</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="grid grid-cols-3 gap-2">
                  {communities.slice(0, 9).map((community) => (
                    <div key={community.id} className="text-center">
                      <img 
                        src={community.photo_url} 
                        alt={community.name}
                        className="w-full aspect-square rounded-lg object-cover mb-1 hover:opacity-80 transition-opacity cursor-pointer"
                      />
                      <p className="text-xs text-gray-600 truncate">{community.name}</p>
                    </div>
                  ))}
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* Top Friends */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>Top 10 Amigos</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="text-center">
                      <img 
                        src={`https://images.pexels.com/photos/${220000 + idx}/pexels-photo-${220000 + idx}.jpeg?auto=compress&cs=tinysrgb&w=100`}
                        alt={`Amigo ${idx + 1}`}
                        className="w-12 h-12 rounded-full mx-auto mb-1 object-cover hover:opacity-80 transition-opacity cursor-pointer"
                      />
                      <p className="text-xs text-gray-600">Amigo {idx + 1}</p>
                    </div>
                  ))}
                </div>
              </OrkutCardContent>
            </OrkutCard>
          </div>
        </div>
      </div>

      <OrkyAssistant />
    </div>
  )
}