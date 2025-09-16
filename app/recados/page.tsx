'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/local-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { OrkyAssistant } from '@/components/voice/orky-assistant'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { 
  MessageCircle, 
  Send, 
  Users, 
  Heart,
  Reply,
  Trash2,
  Search,
  Filter
} from 'lucide-react'

interface Message {
  id: number
  from_profile_id: string
  to_profile_id: string
  content: string
  created_at: string
  from_profile: {
    username: string
    name: string
    photo_url?: string
  }
  to_profile: {
    username: string
    name: string
    photo_url?: string
  }
}

interface Scrap {
  id: number
  from_profile_id: string
  to_profile_id: string
  content: string
  created_at: string
  from_profile: {
    username: string
    name: string
    photo_url?: string
  }
}

export default function MessagesPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [scraps, setScraps] = useState<Scrap[]>([])
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'scraps'>('received')
  const [newMessage, setNewMessage] = useState('')
  const [newScrap, setNewScrap] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user && profile) {
      loadMessages()
      loadScraps()
    }
  }, [user, profile, loading, router])

  const loadMessages = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          from_profile:profiles!from_profile_id(username, name, photo_url),
          to_profile:profiles!to_profile_id(username, name, photo_url)
        `)
        .or(`from_profile_id.eq.${user.id},to_profile_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const loadScraps = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('scraps')
        .select(`
          *,
          from_profile:profiles!from_profile_id(username, name, photo_url)
        `)
        .eq('to_profile_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setScraps(data || [])
    } catch (error) {
      console.error('Error loading scraps:', error)
    }
  }

  const sendMessage = async () => {
    if (!user || !newMessage.trim() || !selectedUser) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          from_profile_id: user.id,
          to_profile_id: selectedUser,
          content: newMessage.trim()
        })

      if (error) throw error
      
      setNewMessage('')
      setSelectedUser('')
      loadMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const sendScrap = async (toProfileId: string) => {
    if (!user || !newScrap.trim()) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('scraps')
        .insert({
          from_profile_id: user.id,
          to_profile_id: toProfileId,
          content: newScrap.trim()
        })

      if (error) throw error
      
      setNewScrap('')
      loadScraps()
    } catch (error) {
      console.error('Error sending scrap:', error)
      alert('Erro ao enviar recado')
    } finally {
      setSending(false)
    }
  }

  const deleteMessage = async (messageId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('to_profile_id', user?.id) // Only delete if user is the recipient

      if (error) throw error
      loadMessages()
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const deleteScrap = async (scrapId: number) => {
    if (!confirm('Tem certeza que deseja excluir este recado?')) return

    try {
      const { error } = await supabase
        .from('scraps')
        .delete()
        .eq('id', scrapId)
        .eq('to_profile_id', user?.id) // Only delete if user is the recipient

      if (error) throw error
      loadScraps()
    } catch (error) {
      console.error('Error deleting scrap:', error)
    }
  }

  const getFilteredMessages = () => {
    let filtered = messages

    if (activeTab === 'received') {
      filtered = messages.filter(msg => msg.to_profile_id === user?.id)
    } else if (activeTab === 'sent') {
      filtered = messages.filter(msg => msg.from_profile_id === user?.id)
    }

    if (searchTerm) {
      filtered = filtered.filter(msg => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.from_profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.to_profile.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const getFilteredScraps = () => {
    if (!searchTerm) return scraps

    return scraps.filter(scrap => 
      scrap.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scrap.from_profile.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
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

  const filteredMessages = getFilteredMessages()
  const filteredScraps = getFilteredScraps()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mensagens & Recados</h1>
          <p className="text-gray-600">Converse com seus amigos e deixe recados especiais</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeTab === 'received' ? 'default' : 'outline'}
            onClick={() => setActiveTab('received')}
            className={activeTab === 'received' ? 'bg-purple-500' : 'border-purple-300 text-purple-700'}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Recebidas ({messages.filter(m => m.to_profile_id === user.id).length})
          </Button>
          <Button
            variant={activeTab === 'sent' ? 'default' : 'outline'}
            onClick={() => setActiveTab('sent')}
            className={activeTab === 'sent' ? 'bg-purple-500' : 'border-purple-300 text-purple-700'}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviadas ({messages.filter(m => m.from_profile_id === user.id).length})
          </Button>
          <Button
            variant={activeTab === 'scraps' ? 'default' : 'outline'}
            onClick={() => setActiveTab('scraps')}
            className={activeTab === 'scraps' ? 'bg-purple-500' : 'border-purple-300 text-purple-700'}
          >
            <Heart className="h-4 w-4 mr-2" />
            Recados ({scraps.length})
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar mensagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-purple-300 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Messages/Scraps List */}
          <div className="lg:col-span-2 space-y-4">
            {loadingMessages ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-purple-600">Carregando mensagens...</p>
              </div>
            ) : (
              <>
                {activeTab === 'scraps' ? (
                  filteredScraps.length === 0 ? (
                    <OrkutCard>
                      <OrkutCardContent>
                        <div className="text-center py-12">
                          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum recado ainda</h3>
                          <p className="text-gray-600">Seus amigos ainda não deixaram recados para você!</p>
                        </div>
                      </OrkutCardContent>
                    </OrkutCard>
                  ) : (
                    filteredScraps.map(scrap => (
                      <OrkutCard key={scrap.id}>
                        <OrkutCardContent>
                          <div className="flex items-start space-x-3 p-4">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={scrap.from_profile.photo_url} alt={scrap.from_profile.name} />
                              <AvatarFallback>{scrap.from_profile.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-gray-800">{scrap.from_profile.name}</p>
                                  <p className="text-sm text-gray-500">@{scrap.from_profile.username}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    {new Date(scrap.created_at).toLocaleDateString('pt-BR')}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteScrap(scrap.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="mt-3 p-3 bg-pink-50 rounded-lg border-l-4 border-pink-400">
                                <p className="text-gray-700">{scrap.content}</p>
                              </div>
                            </div>
                          </div>
                        </OrkutCardContent>
                      </OrkutCard>
                    ))
                  )
                ) : (
                  filteredMessages.length === 0 ? (
                    <OrkutCard>
                      <OrkutCardContent>
                        <div className="text-center py-12">
                          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-800 mb-2">
                            Nenhuma mensagem {activeTab === 'sent' ? 'enviada' : 'recebida'}
                          </h3>
                          <p className="text-gray-600">
                            {activeTab === 'sent' 
                              ? 'Você ainda não enviou nenhuma mensagem.' 
                              : 'Você ainda não recebeu nenhuma mensagem.'}
                          </p>
                        </div>
                      </OrkutCardContent>
                    </OrkutCard>
                  ) : (
                    filteredMessages.map(message => {
                      const isReceived = message.to_profile_id === user?.id
                      const otherProfile = isReceived ? message.from_profile : message.to_profile
                      
                      return (
                        <OrkutCard key={message.id}>
                          <OrkutCardContent>
                            <div className="flex items-start space-x-3 p-4">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={otherProfile.photo_url} alt={otherProfile.name} />
                                <AvatarFallback>{otherProfile.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-gray-800">{otherProfile.name}</p>
                                    <p className="text-sm text-gray-500">@{otherProfile.username}</p>
                                    {!isReceived && (
                                      <Badge variant="outline" className="mt-1 text-xs border-green-300 text-green-700">
                                        Enviada
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">
                                      {new Date(message.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                    {isReceived && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => deleteMessage(message.id)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                  <p className="text-gray-700">{message.content}</p>
                                </div>
                              </div>
                            </div>
                          </OrkutCardContent>
                        </OrkutCard>
                      )
                    })
                  )
                )}
              </>
            )}
          </div>

          {/* Compose Panel */}
          <div className="space-y-6">
            
            {/* Send Message */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4 text-purple-600" />
                  <span>✉️ nova mensagem</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Para (ID do usuário)
                    </label>
                    <Input
                      placeholder="ID do destinatário..."
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="border-purple-300 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Mensagem
                    </label>
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="border-purple-300 focus:ring-purple-500 min-h-[100px]"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {newMessage.length}/500 caracteres
                    </p>
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !selectedUser || sending}
                    className="w-full bg-purple-500 hover:bg-purple-600"
                  >
                    {sending ? 'Enviando...' : 'Enviar Mensagem'}
                  </Button>
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* Send Scrap */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-pink-600" />
                  <span>💕 deixar recado</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Recado
                    </label>
                    <Textarea
                      placeholder="Deixe um recado especial..."
                      value={newScrap}
                      onChange={(e) => setNewScrap(e.target.value)}
                      className="border-pink-300 focus:ring-pink-500 min-h-[100px]"
                      maxLength={300}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {newScrap.length}/300 caracteres
                    </p>
                  </div>
                  <Input
                    placeholder="Para (ID do usuário)..."
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="border-pink-300 focus:ring-pink-500"
                  />
                  <Button
                    onClick={() => sendScrap(selectedUser)}
                    disabled={!newScrap.trim() || !selectedUser || sending}
                    className="w-full bg-pink-500 hover:bg-pink-600"
                  >
                    {sending ? 'Enviando...' : 'Deixar Recado'}
                  </Button>
                </div>
              </OrkutCardContent>
            </OrkutCard>

            {/* Stats */}
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>📊 estatísticas</span>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Mensagens recebidas:</span>
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      {messages.filter(m => m.to_profile_id === user.id).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Mensagens enviadas:</span>
                    <Badge variant="outline" className="border-green-300 text-green-700">
                      {messages.filter(m => m.from_profile_id === user.id).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Recados recebidos:</span>
                    <Badge variant="outline" className="border-pink-300 text-pink-700">
                      {scraps.length}
                    </Badge>
                  </div>
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
