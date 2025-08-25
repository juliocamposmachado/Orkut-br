'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { OrkyAssistant } from '@/components/voice/orky-assistant'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
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
  UserMinus,
  Upload,
  Send,
  FileText,
  CheckCircle,
  X,
  Download,
  Globe
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

interface Contact {
  id?: string
  email: string
  name: string
  phone?: string | null
  status: 'imported' | 'sent' | 'accepted' | 'declined'
  source: 'google' | 'csv' | 'manual'
  invited_at?: string
  created_at?: string
}

export default function FriendsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [sentRequests, setSentRequests] = useState<Friend[]>([])
  const [searchResults, setSearchResults] = useState<Friend[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [searching, setSearching] = useState(false)
  
  // Invite states
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [uploadingCSV, setUploadingCSV] = useState(false)
  const [importingGoogle, setImportingGoogle] = useState(false)
  const [sendingInvites, setSendingInvites] = useState(false)
  const [inviteMessage, setInviteMessage] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [manualEmail, setManualEmail] = useState('')
  const [manualName, setManualName] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadFriends()
      loadRequests()
      loadContacts()
    }
  }, [user, loading, router])

  // Escutar eventos globais de atualização de amigos
  useEffect(() => {
    const handleFriendRequestAccepted = (event: any) => {
      console.log('📨 Evento friendRequestAccepted recebido:', event.detail)
      // Recarregar listas
      loadFriends()
      loadRequests()
    }

    const handleFriendsListUpdated = (event: any) => {
      console.log('📨 Evento friendsListUpdated recebido:', event.detail)
      // Recarregar listas
      loadFriends()
      loadRequests()
    }

    window.addEventListener('friendRequestAccepted', handleFriendRequestAccepted)
    window.addEventListener('friendsListUpdated', handleFriendsListUpdated)

    return () => {
      window.removeEventListener('friendRequestAccepted', handleFriendRequestAccepted)
      window.removeEventListener('friendsListUpdated', handleFriendsListUpdated)
    }
  }, [user])

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

      // Get the friend's profile info for notification
      const friendInfo = searchResults.find(friend => friend.id === friendId)
      
      if (friendInfo) {
        // Create real notification for friend request
        try {
          const notificationData = {
            profile_id: friendId,
            type: 'friend_request',
            payload: {
              from_user: {
                id: user.id,
                display_name: profile?.display_name || user.email || '',
                photo_url: profile?.photo_url || null,
                username: profile?.username || user.email?.split('@')[0] || ''
              },
              action_url: `/perfil/${profile?.username || user.email?.split('@')[0] || ''}`
            },
            read: false
          }

          // Try to insert notification in database
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert(notificationData)
            
          if (notificationError) {
            console.warn('Failed to create notification in database:', notificationError)
            // Fallback: add to local storage for the target user
            const existingNotifications = JSON.parse(
              localStorage.getItem(`notifications_${friendId}`) || '[]'
            )
            
            const localNotification = {
              id: Date.now().toString(),
              type: 'friend_request',
              title: 'Solicitação de amizade',
              message: 'enviou uma solicitação de amizade',
              read: false,
              created_at: new Date().toISOString(),
              from_user: notificationData.payload.from_user
            }
            
            const updatedNotifications = [localNotification, ...existingNotifications].slice(0, 50)
            localStorage.setItem(`notifications_${friendId}`, JSON.stringify(updatedNotifications))
          } else {
            console.log('✅ Friend request notification created successfully')
          }
        } catch (notificationError) {
          console.warn('Error creating friend request notification:', notificationError)
        }
      }

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

  // Invite functions
  const loadContacts = async () => {
    if (!user || !supabase) return

    setLoadingContacts(true)
    try {
      const { data, error } = await supabase
        .from('email_invites')
        .select('*')
        .eq('inviter_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const contactsList: Contact[] = (data || []).map(invite => ({
        id: invite.id,
        email: invite.email,
        name: invite.name || invite.email.split('@')[0],
        phone: invite.phone,
        status: invite.status as Contact['status'],
        source: invite.source as Contact['source'],
        invited_at: invite.invited_at,
        created_at: invite.created_at
      }))

      setContacts(contactsList)
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setLoadingContacts(false)
    }
  }

  const importGoogleContacts = async () => {
    if (!user) return

    setImportingGoogle(true)
    try {
      // Primeira tentativa: usar sessão existente do Google se o usuário está logado
      const sessionResponse = await fetch('/api/import-google-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useExistingSession: true })
      })
      
      const sessionResult = await sessionResponse.json()
      
      if (sessionResult.success) {
        alert(`✅ Contatos importados com sucesso!\nImportados: ${sessionResult.imported} | Já existentes: ${sessionResult.existing}`)
        loadContacts()
        setImportingGoogle(false)
        return
      }
      
      // Se não conseguiu usar a sessão existente, fazer OAuth tradicional
      console.log('Sessão existente não disponível, iniciando OAuth...')
      
      // Get Google OAuth URL
      const response = await fetch('/api/import-google-contacts')
      const { authUrl } = await response.json()

      if (authUrl) {
        const popup = window.open(authUrl, 'google-auth', 'width=500,height=650')

        // Handler to receive token from callback window
        const onMessage = async (event: MessageEvent) => {
          const data = event.data as any
          if (!data || typeof data !== 'object') return
          if (data.type === 'google-contacts-token' && data.accessToken) {
            window.removeEventListener('message', onMessage)
            try {
              const res = await fetch('/api/import-google-contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: data.accessToken })
              })
              const result = await res.json()
              if (result.success) {
                alert(`✅ Contatos importados com sucesso!\nImportados: ${result.imported} | Já existentes: ${result.existing}`)
                loadContacts()
              } else {
                alert(result.error || 'Falha ao importar contatos')
              }
            } catch (e) {
              console.error('Import error:', e)
              alert('Erro ao importar contatos')
            } finally {
              setImportingGoogle(false)
            }
            // fecha popup se ainda aberto
            try { popup?.close() } catch {}
          } else if (data.type === 'google-contacts-error') {
            window.removeEventListener('message', onMessage)
            setImportingGoogle(false)
            alert('Erro no OAuth do Google: ' + (data.error || 'desconhecido'))
            try { popup?.close() } catch {}
          }
        }

        window.addEventListener('message', onMessage)
      }
    } catch (error) {
      console.error('Error importing Google contacts:', error)
      alert('Erro ao conectar com o Google. Tente novamente.')
      setImportingGoogle(false)
    }
  }

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingCSV(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-csv-contacts', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`${result.imported} contatos importados com sucesso!`)
        loadContacts()
      } else {
        alert(result.error || 'Erro ao processar arquivo CSV')
      }
    } catch (error) {
      console.error('Error uploading CSV:', error)
      alert('Erro ao fazer upload do arquivo CSV')
    } finally {
      setUploadingCSV(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const addManualContact = async () => {
    if (!manualEmail || !manualName || !user || !supabase) return

    try {
      const { error } = await supabase
        .from('email_invites')
        .insert({
          inviter_id: user.id,
          email: manualEmail.toLowerCase(),
          name: manualName,
          source: 'manual',
          status: 'imported'
        })

      if (error) throw error

      setManualEmail('')
      setManualName('')
      loadContacts()
      alert('Contato adicionado com sucesso!')
    } catch (error) {
      console.error('Error adding manual contact:', error)
      alert('Erro ao adicionar contato')
    }
  }

  const sendSingleInvite = async (contactEmail: string) => {
    if (!user) return

    try {
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: [{ email: contactEmail, name: contacts.find(c => c.email === contactEmail)?.name }],
          message: inviteMessage
        })
      })

      const result = await response.json()
      
      if (result.success && result.sent > 0) {
        alert('Convite enviado com sucesso!')
        loadContacts()
      } else {
        alert('Erro ao enviar convite')
      }
    } catch (error) {
      console.error('Error sending invite:', error)
      alert('Erro ao enviar convite')
    }
  }

  const sendBatchInvites = async () => {
    if (!user || selectedContacts.size === 0) return

    if (selectedContacts.size > 50) {
      alert('Máximo de 50 convites por vez para evitar spam')
      return
    }

    setSendingInvites(true)
    try {
      const emailsToSend = Array.from(selectedContacts).map(email => {
        const contact = contacts.find(c => c.email === email)
        return { email, name: contact?.name }
      })

      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: emailsToSend,
          message: inviteMessage
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`${result.sent} convites enviados com sucesso!`)
        setSelectedContacts(new Set())
        loadContacts()
      } else {
        alert('Erro ao enviar convites')
      }
    } catch (error) {
      console.error('Error sending batch invites:', error)
      alert('Erro ao enviar convites')
    } finally {
      setSendingInvites(false)
    }
  }

  const toggleContactSelection = (email: string) => {
    const newSelection = new Set(selectedContacts)
    if (newSelection.has(email)) {
      newSelection.delete(email)
    } else {
      newSelection.add(email)
    }
    setSelectedContacts(newSelection)
  }

  const selectAllContacts = () => {
    const availableContacts = contacts.filter(c => c.status === 'imported')
    if (selectedContacts.size === availableContacts.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(availableContacts.map(c => c.email)))
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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="friends">Amigos ({friends.length})</TabsTrigger>
                <TabsTrigger value="requests">Solicitações ({pendingRequests.length})</TabsTrigger>
                <TabsTrigger value="sent">Enviadas ({sentRequests.length})</TabsTrigger>
                <TabsTrigger value="search">Buscar</TabsTrigger>
                <TabsTrigger value="invite">Convidar</TabsTrigger>
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

              {/* Invite Tab */}
              <TabsContent value="invite" className="space-y-6" onFocus={loadContacts}>
                {/* Import Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Import Methods */}
                  <OrkutCard>
                    <OrkutCardHeader>
                      <span className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Importar Contatos
                      </span>
                    </OrkutCardHeader>
                    <OrkutCardContent className="space-y-4">
                      
                      {/* Google Import */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Globe className="h-6 w-6 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-gray-800">Google Contatos</h4>
                            <p className="text-sm text-gray-600">Importação direta dos seus contatos</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Button 
                            onClick={importGoogleContacts}
                            disabled={importingGoogle}
                            className="w-full bg-blue-500 hover:bg-blue-600"
                          >
                            {importingGoogle ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Importando...
                              </>
                            ) : (
                              <>
                                <Globe className="h-4 w-4 mr-2" />
                                Importar do Google
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-gray-500">
                            💡 Se você fez login com Google, seus contatos serão importados automaticamente!
                          </p>
                        </div>
                      </div>

                      {/* CSV Upload */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="h-6 w-6 text-green-600" />
                          <div>
                            <h4 className="font-medium text-gray-800">Arquivo CSV</h4>
                            <p className="text-sm text-gray-600">Upload de lista de contatos</p>
                          </div>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleCSVUpload}
                          className="hidden"
                        />
                        <Button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingCSV}
                          variant="outline"
                          className="w-full border-green-300 text-green-700 hover:bg-green-50"
                        >
                          {uploadingCSV ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                              Processando...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload CSV
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          Formato: email, nome, telefone
                        </p>
                      </div>

                      {/* Manual Add */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <UserPlus className="h-6 w-6 text-purple-600" />
                          <div>
                            <h4 className="font-medium text-gray-800">Adicionar Manualmente</h4>
                            <p className="text-sm text-gray-600">Adicione um contato individual</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="Nome"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            className="border-purple-300"
                          />
                          <Input
                            type="email"
                            placeholder="Email"
                            value={manualEmail}
                            onChange={(e) => setManualEmail(e.target.value)}
                            className="border-purple-300"
                          />
                          <Button 
                            onClick={addManualContact}
                            disabled={!manualEmail || !manualName}
                            className="w-full bg-purple-500 hover:bg-purple-600"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Adicionar Contato
                          </Button>
                        </div>
                      </div>
                    </OrkutCardContent>
                  </OrkutCard>

                  {/* Message Section */}
                  <OrkutCard>
                    <OrkutCardHeader>
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Mensagem do Convite
                      </span>
                    </OrkutCardHeader>
                    <OrkutCardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Mensagem Personalizada (Opcional)
                          </label>
                          <Textarea
                            placeholder="Escreva uma mensagem pessoal para seus convites..."
                            value={inviteMessage}
                            onChange={(e) => setInviteMessage(e.target.value)}
                            rows={4}
                            className="border-purple-300 focus:ring-purple-500"
                            maxLength={500}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {inviteMessage.length}/500 caracteres
                          </p>
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-medium text-purple-800 mb-2">💡 Dicas para um bom convite:</h4>
                          <ul className="text-sm text-purple-700 space-y-1">
                            <li>• Mencione como vocês se conhecem</li>
                            <li>• Explique por que gostaria de conectar</li>
                            <li>• Seja amigável e pessoal</li>
                            <li>• Mantenha a mensagem curta</li>
                          </ul>
                        </div>
                      </div>
                    </OrkutCardContent>
                  </OrkutCard>
                </div>

                {/* Contacts List */}
                <OrkutCard>
                  <OrkutCardHeader>
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Contatos Importados ({contacts.length})
                      </span>
                      
                      {contacts.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={selectAllContacts}
                            className="border-purple-300 text-purple-700"
                          >
                            {selectedContacts.size === contacts.filter(c => c.status === 'imported').length ? 'Desmarcar' : 'Selecionar'} Todos
                          </Button>
                          
                          {selectedContacts.size > 0 && (
                            <Button
                              size="sm"
                              onClick={sendBatchInvites}
                              disabled={sendingInvites || selectedContacts.size === 0}
                              className="bg-purple-500 hover:bg-purple-600"
                            >
                              {sendingInvites ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Enviar {selectedContacts.size} Convite{selectedContacts.size > 1 ? 's' : ''}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </OrkutCardHeader>
                  
                  <OrkutCardContent>
                    {loadingContacts ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-purple-600">Carregando contatos...</p>
                      </div>
                    ) : contacts.length === 0 ? (
                      <div className="text-center py-12">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum contato importado</h3>
                        <p className="text-gray-600 mb-4">
                          Importe contatos do Google, faça upload de um CSV ou adicione manualmente.
                        </p>
                        <div className="flex justify-center gap-2">
                          <Button
                            onClick={importGoogleContacts}
                            disabled={importingGoogle}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            Importar do Google
                          </Button>
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="border-green-300 text-green-700"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload CSV
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Stats */}
                        <div className="flex gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                            <span>Importados: {contacts.filter(c => c.status === 'imported').length}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span>Enviados: {contacts.filter(c => c.status === 'sent').length}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span>Aceitos: {contacts.filter(c => c.status === 'accepted').length}</span>
                          </div>
                        </div>

                        {/* Contact List */}
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {contacts.map((contact) => (
                            <div key={contact.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-3">
                                {contact.status === 'imported' && (
                                  <input
                                    type="checkbox"
                                    checked={selectedContacts.has(contact.email)}
                                    onChange={() => toggleContactSelection(contact.email)}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                  />
                                )}
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-gray-800">{contact.name}</h4>
                                    <Badge 
                                      variant="secondary"
                                      className={`text-xs ${
                                        contact.status === 'imported' ? 'bg-gray-100 text-gray-700' :
                                        contact.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                        contact.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                        'bg-red-100 text-red-700'
                                      }`}
                                    >
                                      {contact.status === 'imported' ? 'Importado' :
                                       contact.status === 'sent' ? 'Enviado' :
                                       contact.status === 'accepted' ? 'Aceito' : 'Recusado'}
                                    </Badge>
                                    
                                    <Badge variant="outline" className="text-xs">
                                      {contact.source === 'google' ? 'Google' :
                                       contact.source === 'csv' ? 'CSV' : 'Manual'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">{contact.email}</p>
                                  {contact.phone && (
                                    <p className="text-xs text-gray-500">{contact.phone}</p>
                                  )}
                                  {contact.invited_at && (
                                    <p className="text-xs text-gray-400">
                                      Enviado: {new Date(contact.invited_at).toLocaleDateString('pt-BR')}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {contact.status === 'imported' && (
                                  <Button
                                    size="sm"
                                    onClick={() => sendSingleInvite(contact.email)}
                                    className="bg-purple-500 hover:bg-purple-600"
                                  >
                                    <Send className="h-3 w-3 mr-1" />
                                    Enviar
                                  </Button>
                                )}
                                
                                {contact.status === 'sent' && (
                                  <div className="flex items-center gap-1 text-blue-600">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-sm">Enviado</span>
                                  </div>
                                )}
                                
                                {contact.status === 'accepted' && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <UserCheck className="h-4 w-4" />
                                    <span className="text-sm">Aceito</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Batch Actions */}
                        {selectedContacts.size > 0 && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-purple-600" />
                                <span className="font-medium text-purple-800">
                                  {selectedContacts.size} contato{selectedContacts.size > 1 ? 's' : ''} selecionado{selectedContacts.size > 1 ? 's' : ''}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedContacts(new Set())}
                                  className="border-purple-300 text-purple-700"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancelar
                                </Button>
                                
                                <Button
                                  size="sm"
                                  onClick={sendBatchInvites}
                                  disabled={sendingInvites}
                                  className="bg-purple-500 hover:bg-purple-600"
                                >
                                  {sendingInvites ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                      Enviando...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-3 w-3 mr-1" />
                                      Enviar Convites
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            {selectedContacts.size > 50 && (
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
                                ⚠️ Máximo de 50 convites por vez para evitar spam. Desmarque alguns contatos.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </OrkutCardContent>
                </OrkutCard>
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
