'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { OrkyAssistant } from '@/components/voice/orky-assistant'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommunityManagement } from '@/components/communities/community-management'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  ArrowLeft,
  Users, 
  Plus, 
  MessageCircle,
  Heart,
  Share2,
  MoreHorizontal,
  Crown,
  UserPlus,
  UserMinus,
  Settings,
  Star,
  Calendar,
  Eye
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface Community {
  id: number
  name: string
  description: string
  category: string
  photo_url: string
  members_count: number
  owner: string | null
  privacy: string
  rules: string
  created_at: string
}

interface CommunityPost {
  id: number
  community_id: number
  author_id: string
  content: string
  likes_count: number
  comments_count: number
  created_at: string
  author: {
    id: string
    username: string
    display_name: string
    photo_url: string | null
  }
}

interface Member {
  id: string
  username: string
  display_name: string
  photo_url: string | null
  role: 'member' | 'moderator' | 'admin'
  joined_at: string
}

export default function CommunityPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const communityId = params?.id as string
  
  const [community, setCommunity] = useState<Community | null>(null)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [newPost, setNewPost] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [loadingCommunity, setLoadingCommunity] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [memberRole, setMemberRole] = useState<'member' | 'moderator' | 'admin' | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user && communityId) {
      loadCommunity()
      loadPosts()
      loadMembers()
      checkMembership()
    }
  }, [user, loading, router, communityId])

  const loadCommunity = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single()

      if (error) throw error
      setCommunity(data)
    } catch (error) {
      console.error('Error loading community:', error)
      toast.error('Erro ao carregar comunidade')
    } finally {
      setLoadingCommunity(false)
    }
  }

  const loadPosts = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/posts`)
      const result = await response.json()
      
      if (result.success) {
        setPosts(result.posts || [])
      } else {
        console.error('Error loading posts:', result.error)
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    }
  }

  const loadMembers = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/members`)
      const result = await response.json()
      
      if (result.success) {
        setMembers(result.members || [])
      } else {
        console.error('Error loading members:', result.error)
      }
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }

  const checkMembership = async () => {
    try {
      if (!user?.id) {
        console.warn('User ID não encontrado para verificar membership')
        setIsMember(false)
        setMemberRole(null)
        return
      }

      console.log('🔍 Verificando membership para user:', user.id, 'na comunidade:', communityId)
      
      // Primeiro tentar com user.id diretamente
      let { data, error } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('profile_id', user.id)
        .single()

      // Se não encontrar e profile.id for diferente, tentar com profile.id
      if (!data && profile?.id && profile.id !== user.id) {
        console.log('🔄 Tentando com profile.id:', profile.id)
        const result = await supabase
          .from('community_members')
          .select('role')
          .eq('community_id', communityId)
          .eq('profile_id', profile.id)
          .single()
        data = result.data
        error = result.error
      }

      if (data) {
        console.log('✅ Usuário é membro da comunidade:', data.role)
        setIsMember(true)
        setMemberRole(data.role)
      } else {
        console.log('❌ Usuário não é membro da comunidade')
        setIsMember(false)
        setMemberRole(null)
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar membership ou usuário não é membro:', error)
      setIsMember(false)
      setMemberRole(null)
    }
  }

  const joinCommunity = async () => {
    if (!user || isMember) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      if (!token) {
        toast.error('Você precisa estar logado para entrar na comunidade')
        return
      }

      const response = await fetch(`/api/communities/${communityId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        setIsMember(true)
        setMemberRole('member')
        toast.success(result.message || 'Você entrou na comunidade!')
        
        // Reload data
        loadCommunity()
        loadMembers()
      } else {
        throw new Error(result.error || 'Erro ao entrar na comunidade')
      }
    } catch (error: any) {
      console.error('Error joining community:', error)
      toast.error(error.message || 'Erro ao entrar na comunidade')
    }
  }

  const createPost = async () => {
    if (!user || !newPost.trim() || !isMember) {
      toast.error('Você precisa estar logado e ser membro da comunidade para postar')
      return
    }

    setIsPosting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      if (!token) {
        toast.error('Você precisa estar logado para criar posts')
        return
      }

      console.log('Criando post via API:', {
        communityId,
        content: newPost.trim(),
        author: user.id
      })

      const response = await fetch(`/api/communities/${communityId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newPost.trim()
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('Post criado com sucesso:', result.post)
        setNewPost('')
        toast.success(result.message || 'Post criado com sucesso!')
        loadPosts() // Recarregar posts
      } else {
        throw new Error(result.error || 'Erro ao criar post')
      }
    } catch (error: any) {
      console.error('Error creating post:', error)
      toast.error(error.message || 'Erro ao criar post')
    } finally {
      setIsPosting(false)
    }
  }

  if (loading || loadingCommunity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600">Carregando comunidade...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile || !community) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4 text-purple-600 hover:text-purple-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar às Comunidades
        </Button>

        {/* Debug Info - remover depois */}
        {process.env.NODE_ENV === 'development' && (
          <OrkutCard className="mb-4 bg-yellow-50 border-yellow-200">
            <OrkutCardContent className="p-3">
              <div className="text-xs space-y-1">
                <p><strong>🐛 Debug Info:</strong></p>
                <p>User ID: {user?.id || 'N/A'}</p>
                <p>Profile ID: {profile?.id || 'N/A'}</p>
                <p>Community ID: {communityId}</p>
                <p>Is Member: {isMember ? '✅ Sim' : '❌ Não'}</p>
                <p>Member Role: {memberRole || 'N/A'}</p>
                <p>Loading: {loading ? 'Sim' : 'Não'}</p>
              </div>
            </OrkutCardContent>
          </OrkutCard>
        )}

        {/* Community Header */}
        <OrkutCard variant="gradient" className="mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
              
              {/* Community Image */}
              <img
                src={community.photo_url}
                alt={community.name}
                className="w-32 h-32 object-cover rounded-lg border-4 border-white shadow-lg"
              />

              {/* Community Info */}
              <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{community.name}</h1>
                    <p className="text-gray-700 mb-4 max-w-2xl">{community.description}</p>
                    
                    <div className="flex flex-wrap gap-3 mb-4">
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        {community.category}
                      </Badge>
                      <Badge variant="outline" className="border-gray-300">
                        <Users className="h-3 w-3 mr-1" />
                        {community.members_count} membros
                      </Badge>
                      <Badge variant="outline" className="border-gray-300">
                        <Calendar className="h-3 w-3 mr-1" />
                        Desde {new Date(community.created_at).toLocaleDateString('pt-BR')}
                      </Badge>
                      <Badge variant="outline" className="border-gray-300">
                        <Star className="h-3 w-3 mr-1" />
                        4.8 estrelas
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 mt-4 lg:mt-0">
                    {!isMember ? (
                      <Button 
                        onClick={joinCommunity}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Entrar na Comunidade
                      </Button>
                    ) : (
                      <div className="flex space-x-2">
                        <Button variant="outline" className="border-purple-300 text-purple-700">
                          <UserMinus className="h-4 w-4 mr-2" />
                          Sair
                        </Button>
                        {(memberRole === 'admin' || memberRole === 'moderator') && (
                          <CommunityManagement 
                            communityId={parseInt(communityId)}
                            userRole={memberRole}
                            onUpdate={() => {
                              loadCommunity()
                              loadMembers()
                              checkMembership()
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </OrkutCard>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar */}
          <div className="space-y-6">
            
            {/* Community Stats */}
            <OrkutCard>
              <OrkutCardHeader>
                <span>Informações</span>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Membros:</span>
                    <Badge variant="outline">{community.members_count}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Posts:</span>
                    <Badge variant="outline">{posts.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Categoria:</span>
                    <Badge variant="outline">{community.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Privacidade:</span>
                    <Badge variant="outline">{community.privacy}</Badge>
                  </div>
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* Recent Members */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center justify-between">
                  <span>Membros Recentes</span>
                  <span className="text-xs text-gray-500">{members.length}</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-3">
                  {members.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.photo_url || undefined} alt={member.display_name} />
                        <AvatarFallback>{member.display_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {member.display_name}
                          {member.role === 'admin' && <Crown className="inline h-3 w-3 ml-1 text-yellow-500" />}
                        </p>
                        <p className="text-xs text-gray-500">@{member.username}</p>
                      </div>
                    </div>
                  ))}
                  {members.length > 5 && (
                    <Button variant="outline" size="sm" className="w-full border-purple-300 text-purple-700">
                      Ver todos os membros
                    </Button>
                  )}
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* Community Rules */}
            {community.rules && (
              <OrkutCard>
                <OrkutCardHeader>
                  <span>Regras da Comunidade</span>
                </OrkutCardHeader>
                <OrkutCardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {community.rules}
                  </p>
                </OrkutCardContent>
              </OrkutCard>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            
            <Tabs defaultValue="posts" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
                <TabsTrigger value="members">Membros ({members.length})</TabsTrigger>
                <TabsTrigger value="about">Sobre</TabsTrigger>
              </TabsList>

              {/* Posts Tab */}
              <TabsContent value="posts" className="space-y-6">
                
                {/* Create Post */}
                {isMember && (
                  <OrkutCard>
                    <OrkutCardHeader>
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-4 w-4 text-purple-600" />
                        <span>💬 Compartilhe algo com a comunidade</span>
                      </div>
                    </OrkutCardHeader>
                    <OrkutCardContent>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile?.photo_url || undefined} alt={profile?.display_name} />
                            <AvatarFallback>{profile?.display_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              placeholder={`O que você quer compartilhar em ${community.name}?`}
                              value={newPost}
                              onChange={(e) => setNewPost(e.target.value)}
                              className="border-purple-300 focus:ring-purple-500 min-h-[100px]"
                              maxLength={1000}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500">
                            {newPost.length}/1000 caracteres
                          </p>
                          <Button
                            onClick={createPost}
                            disabled={!newPost.trim() || isPosting}
                            className="bg-purple-500 hover:bg-purple-600"
                          >
                            {isPosting ? 'Postando...' : 'Publicar'}
                          </Button>
                        </div>
                      </div>
                    </OrkutCardContent>
                  </OrkutCard>
                )}

                {/* Join Message for Non-Members */}
                {!isMember && (
                  <OrkutCard>
                    <OrkutCardContent>
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                          Entre na comunidade para participar
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Você precisa ser membro para ver e criar posts nesta comunidade.
                        </p>
                        <Button 
                          onClick={joinCommunity}
                          className="bg-purple-500 hover:bg-purple-600"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Entrar na Comunidade
                        </Button>
                      </div>
                    </OrkutCardContent>
                  </OrkutCard>
                )}

                {/* Posts List */}
                {isMember && (
                  <>
                    {posts.length === 0 ? (
                      <OrkutCard>
                        <OrkutCardContent>
                          <div className="text-center py-12">
                            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-800 mb-2">
                              Ainda não há posts nesta comunidade
                            </h3>
                            <p className="text-gray-600 mb-4">
                              Seja o primeiro a compartilhar algo interessante!
                            </p>
                          </div>
                        </OrkutCardContent>
                      </OrkutCard>
                    ) : (
                      posts.map((post) => (
                        <OrkutCard key={post.id}>
                          <OrkutCardContent>
                            <div className="p-4">
                              <div className="flex items-start space-x-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={post.author.photo_url || undefined} alt={post.author.display_name} />
                                  <AvatarFallback>{post.author.display_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <Link href={`/perfil/${post.author.username}`}>
                                        <span className="font-medium text-gray-800 hover:text-purple-600 cursor-pointer">
                                          {post.author.display_name}
                                        </span>
                                      </Link>
                                      <span className="text-sm text-gray-500">
                                        {formatDistanceToNow(new Date(post.created_at), { 
                                          addSuffix: true,
                                          locale: ptBR 
                                        })}
                                      </span>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  <p className="text-gray-700 mb-4 whitespace-pre-line">{post.content}</p>
                                  
                                  <div className="flex items-center space-x-4">
                                    <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-50">
                                      <Heart className="h-4 w-4 mr-1" />
                                      {post.likes_count || 0}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-50">
                                      <MessageCircle className="h-4 w-4 mr-1" />
                                      {post.comments_count || 0}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-50">
                                      <Share2 className="h-4 w-4 mr-1" />
                                      Compartilhar
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </OrkutCardContent>
                        </OrkutCard>
                      ))
                    )}
                  </>
                )}
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((member) => (
                    <OrkutCard key={member.id}>
                      <OrkutCardContent className="p-4 text-center">
                        <Avatar className="h-16 w-16 mx-auto mb-3">
                          <AvatarImage src={member.photo_url || undefined} alt={member.display_name} />
                          <AvatarFallback>{member.display_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h4 className="font-medium text-gray-800 mb-1 flex items-center justify-center">
                          {member.display_name}
                          {member.role === 'admin' && <Crown className="h-3 w-3 ml-1 text-yellow-500" />}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">@{member.username}</p>
                        <Badge 
                          variant={member.role === 'admin' ? 'default' : 'outline'}
                          className={member.role === 'admin' ? 'bg-yellow-500 text-white' : ''}
                        >
                          {member.role === 'admin' ? 'Admin' : 
                           member.role === 'moderator' ? 'Moderador' : 'Membro'}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-2">
                          Desde {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                        </p>
                      </OrkutCardContent>
                    </OrkutCard>
                  ))}
                </div>
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-4">
                <OrkutCard>
                  <OrkutCardHeader>
                    <span>Sobre a Comunidade</span>
                  </OrkutCardHeader>
                  <OrkutCardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Nome</label>
                        <p className="text-gray-800">{community.name}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Descrição</label>
                        <p className="text-gray-800 whitespace-pre-line">{community.description}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Categoria</label>
                        <p className="text-gray-800">{community.category}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Criada em</label>
                        <p className="text-gray-800">{new Date(community.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Membros</label>
                        <p className="text-gray-800">{community.members_count.toLocaleString('pt-BR')}</p>
                      </div>

                      {community.rules && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Regras</label>
                          <p className="text-gray-800 whitespace-pre-line bg-gray-50 p-3 rounded-lg">
                            {community.rules}
                          </p>
                        </div>
                      )}
                    </div>
                  </OrkutCardContent>
                </OrkutCard>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <OrkyAssistant />
    </div>
  )
}
