'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Users, 
  Search, 
  UserPlus, 
  UserCheck, 
  UserX, 
  MessageCircle,
  Eye,
  Phone,
  Video,
  Mail,
  UserMinus
} from 'lucide-react'

interface Friend {
  id: string
  username: string
  display_name: string
  photo_url: string | null
  bio: string | null
  location: string | null
  relationship: string | null
  status: 'accepted' | 'pending' | 'sent'
  created_at: string
}

export default function FriendsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [sentRequests, setSentRequests] = useState<Friend[]>([])
  const [searchResults, setSearchResults] = useState<Friend[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadFriends()
      loadRequests()
    }
  }, [user, loading, router])

  useEffect(() => {
    if (searchTerm.length >= 3) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  const loadFriends = async () => {
    if (!user || !supabase) return

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!requester_id(id, username, display_name, photo_url, bio, location, relationship),
          addressee:profiles!addressee_id(id, username, display_name, photo_url, bio, location, relationship)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to get the friend's profile
      const friendsList = data?.map(friendship => {
        const friend = friendship.requester_id === user.id 
          ? friendship.addressee 
          : friendship.requester
        
        return {
          ...friend,
          status: 'accepted' as const,
          created_at: friendship.created_at
        }
      }) || []

      setFriends(friendsList)
    } catch (error) {
      console.error('Error loading friends:', error)
    } finally {
      setLoadingFriends(false)
    }
  }

  const loadRequests = async () => {
    if (!user || !supabase) return

    try {
      // Pending requests (received)
      const { data: pending, error: pendingError } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!requester_id(id, username, display_name, photo_url, bio, location, relationship)
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (pendingError) throw pendingError

      const pendingList = pending?.map(req => ({
        ...req.requester,
        status: 'pending' as const,
        created_at: req.created_at
      })) || []

      setPendingRequests(pendingList)

      // Sent requests
      const { data: sent, error: sentError } = await supabase
        .from('friendships')
        .select(`
          *,
          addressee:profiles!addressee_id(id, username, display_name, photo_url, bio, location, relationship)
        `)
        .eq('requester_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (sentError) throw sentError

      const sentList = sent?.map(req => ({
        ...req.addressee,
        status: 'sent' as const,
        created_at: req.created_at
      })) || []

      setSentRequests(sentList)
    } catch (error) {
      console.error('Error loading requests:', error)
    }
  }

  const searchUsers = async () => {
    if (!searchTerm.trim() || !user || !supabase) return

    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, photo_url, bio, location, relationship')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .neq('id', user.id)
        .limit(20)

      if (error) throw error

      // Check friendship status for each user
      const usersWithStatus = await Promise.all(
        (data || []).map(async (searchUser) => {
          if (!supabase) return { ...searchUser, status: null, created_at: new Date().toISOString() }
          
          const { data: friendship } = await supabase
            .from('friendships')
            .select('status')
            .or(`and(requester_id.eq.${user.id},addressee_id.eq.${searchUser.id}),and(requester_id.eq.${searchUser.id},addressee_id.eq.${user.id})`)
            .single()

          return {
            ...searchUser,
            status: friendship?.status || null,
            created_at: new Date().toISOString()
          }
        })
      )

      setSearchResults(usersWithStatus)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearching(false)
    }
  }

  const sendFriendRequest = async (friendId: string) => {
    if (!user || !supabase) return

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: friendId,
          status: 'pending'
        })

      if (error) throw error

      // Update search results
      setSearchResults(prev => prev.map(friend => 
        friend.id === friendId 
          ? { ...friend, status: 'sent' }
          : friend
      ))
    } catch (error) {
      console.error('Error sending friend request:', error)
    }
  }

  const acceptFriendRequest = async (friendId: string) => {
    if (!user || !supabase) return

    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('requester_id', friendId)
        .eq('addressee_id', user.id)

      if (error) throw error

      loadFriends()
      loadRequests()
    } catch (error) {
      console.error('Error accepting friend request:', error)
    }
  }

  const rejectFriendRequest = async (friendId: string) => {
    if (!user || !supabase) return

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('requester_id', friendId)
        .eq('addressee_id', user.id)

      if (error) throw error

      loadRequests()
    } catch (error) {
      console.error('Error rejecting friend request:', error)
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!user || !supabase || !confirm('Tem certeza que deseja remover este amigo?')) return

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`)

      if (error) throw error

      loadFriends()
    } catch (error) {
      console.error('Error removing friend:', error)
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
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Amigos</h1>
          <p className="text-gray-600">Conecte-se com pessoas incríveis</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar pessoas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-purple-300 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar - Stats */}
          <div className="space-y-6">
            <OrkutCard>
              <OrkutCardHeader>
                <span>Estatísticas</span>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amigos:</span>
                    <Badge variant="outline">{friends.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Solicitações:</span>
                    <Badge variant="outline">{pendingRequests.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Enviadas:</span>
                    <Badge variant="outline">{sentRequests.length}</Badge>
                  </div>
                </div>
              </OrkutCardContent>
            </OrkutCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            
            <Tabs defaultValue="friends" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="friends">Amigos ({friends.length})</TabsTrigger>
                <TabsTrigger value="requests">Solicitações ({pendingRequests.length})</TabsTrigger>
                <TabsTrigger value="sent">Enviadas ({sentRequests.length})</TabsTrigger>
                <TabsTrigger value="search">Buscar</TabsTrigger>
              </TabsList>

              {/* Friends Tab */}
              <TabsContent value="friends" className="space-y-4">
                {loadingFriends ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-purple-600">Carregando amigos...</p>
                  </div>
                ) : friends.length === 0 ? (
                  <OrkutCard>
                    <OrkutCardContent>
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum amigo ainda</h3>
                        <p className="text-gray-600">Que tal buscar algumas pessoas para adicionar?</p>
                      </div>
                    </OrkutCardContent>
                  </OrkutCard>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friends.map((friend) => (
                      <OrkutCard key={friend.id}>
                        <OrkutCardContent className="p-4">
                          <div className="text-center">
                            <Avatar className="h-16 w-16 mx-auto mb-3">
                              <AvatarImage src={friend.photo_url || undefined} alt={friend.display_name} />
                              <AvatarFallback>{friend.display_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            
                            <h3 className="font-medium text-gray-800 mb-1">{friend.display_name}</h3>
                            <p className="text-sm text-gray-600 mb-2">@{friend.username}</p>
                            
                            {friend.location && (
                              <p className="text-xs text-gray-500 mb-3">{friend.location}</p>
                            )}

                            <div className="flex flex-wrap gap-2 justify-center mb-4">
                              <Link href={`/perfil/${friend.username}`}>
                                <Button size="sm" variant="outline" className="border-purple-300 text-purple-700">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Ver
                                </Button>
                              </Link>
                              <Button size="sm" variant="outline" className="border-purple-300 text-purple-700">
                                <Mail className="h-3 w-3 mr-1" />
                                Msg
                              </Button>
                              <Button size="sm" variant="outline" className="border-purple-300 text-purple-700">
                                <Phone className="h-3 w-3" />
                              </Button>
                            </div>

                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => removeFriend(friend.id)}
                              className="text-red-500 hover:text-red-700 w-full"
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remover
                            </Button>
                          </div>
                        </OrkutCardContent>
                      </OrkutCard>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Requests Tab */}
              <TabsContent value="requests" className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <OrkutCard>
                    <OrkutCardContent>
                      <div className="text-center py-12">
                        <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhuma solicitação</h3>
                        <p className="text-gray-600">Você não tem solicitações de amizade pendentes.</p>
                      </div>
                    </OrkutCardContent>
                  </OrkutCard>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <OrkutCard key={request.id}>
                        <OrkutCardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={request.photo_url || undefined} alt={request.display_name} />
                              <AvatarFallback>{request.display_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-800">{request.display_name}</h3>
                              <p className="text-sm text-gray-600">@{request.username}</p>
                              {request.bio && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{request.bio}</p>
                              )}
                            </div>

                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => acceptFriendRequest(request.id)}
                                className="bg-green-500 hover:bg-green-600 text-white"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Aceitar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => rejectFriendRequest(request.id)}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Recusar
                              </Button>
                            </div>
                          </div>
                        </OrkutCardContent>
                      </OrkutCard>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Sent Requests Tab */}
              <TabsContent value="sent" className="space-y-4">
                {sentRequests.length === 0 ? (
                  <OrkutCard>
                    <OrkutCardContent>
                      <div className="text-center py-12">
                        <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhuma solicitação enviada</h3>
                        <p className="text-gray-600">Você não enviou nenhuma solicitação de amizade ainda.</p>
                      </div>
                    </OrkutCardContent>
                  </OrkutCard>
                ) : (
                  <div className="space-y-4">
                    {sentRequests.map((request) => (
                      <OrkutCard key={request.id}>
                        <OrkutCardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={request.photo_url || undefined} alt={request.display_name} />
                              <AvatarFallback>{request.display_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-800">{request.display_name}</h3>
                              <p className="text-sm text-gray-600">@{request.username}</p>
                              <Badge variant="secondary" className="mt-1">Aguardando resposta</Badge>
                            </div>

                            <Link href={`/perfil/${request.username}`}>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-purple-300 text-purple-700"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Perfil
                              </Button>
                            </Link>
                          </div>
                        </OrkutCardContent>
                      </OrkutCard>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Search Tab */}
              <TabsContent value="search" className="space-y-4">
                {searchTerm.length < 3 ? (
                  <OrkutCard>
                    <OrkutCardContent>
                      <div className="text-center py-12">
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Busque por pessoas</h3>
                        <p className="text-gray-600">Digite pelo menos 3 caracteres para buscar usuários.</p>
                      </div>
                    </OrkutCardContent>
                  </OrkutCard>
                ) : searching ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-purple-600">Buscando usuários...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <OrkutCard>
                    <OrkutCardContent>
                      <div className="text-center py-12">
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum resultado</h3>
                        <p className="text-gray-600">Não encontramos ninguém com esse nome.</p>
                      </div>
                    </OrkutCardContent>
                  </OrkutCard>
                ) : (
                  <div className="space-y-4">
                    {searchResults.map((user) => (
                      <OrkutCard key={user.id}>
                        <OrkutCardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.photo_url || undefined} alt={user.display_name} />
                              <AvatarFallback>{user.display_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-800">{user.display_name}</h3>
                              <p className="text-sm text-gray-600">@{user.username}</p>
                              {user.bio && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{user.bio}</p>
                              )}
                              {user.location && (
                                <p className="text-xs text-gray-400 mt-1">{user.location}</p>
                              )}
                            </div>

                            <div className="flex space-x-2">
                              <Link href={`/perfil/${user.username}`}>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-purple-300 text-purple-700"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver
                                </Button>
                              </Link>
                              
                              {user.status === 'accepted' && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                  Já é amigo
                                </Badge>
                              )}
                              
                              {user.status === 'pending' && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                  Solicitação recebida
                                </Badge>
                              )}
                              
                              {user.status === 'sent' && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                  Solicitação enviada
                                </Badge>
                              )}
                              
                              {!user.status && (
                                <Button 
                                  size="sm" 
                                  onClick={() => sendFriendRequest(user.id)}
                                  className="bg-purple-500 hover:bg-purple-600"
                                >
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Adicionar
                                </Button>
                              )}
                            </div>
                          </div>
                        </OrkutCardContent>
                      </OrkutCard>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <OrkyAssistant />
    </div>
  )
}
