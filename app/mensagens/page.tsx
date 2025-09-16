'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video, 
  ArrowLeft,
  Check,
  CheckCheck,
  Mic,
  PhoneCall,
  Users,
  Settings,
  Plus,
  Archive,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRealMessages, type RealContact, type RealMessage } from '@/hooks/use-real-messages'
import { useCall } from '@/hooks/use-call'
import { CallModal } from '@/components/call/call-modal'
import { toast } from 'sonner'

export default function MensagensPage() {
  const { user, profile } = useAuth()
  const { callState, startVideoCall, startAudioCall, endCall } = useCall()
  const {
    contacts,
    messages,
    loading,
    loadingMessages,
    selectedContactId,
    setSelectedContactId,
    sendMessage,
    refreshContacts
  } = useRealMessages()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isMobileView, setIsMobileView] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  
  const selectedContact = contacts.find(c => c.id === selectedContactId) || null

  // Stats dos contatos
  const contactStats = {
    total: contacts.length,
    online: contacts.filter(c => c.isOnline).length,
    unread: contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
  }


  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])


  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-refresh messages every 1 minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedContactId && !isRefreshing) {
        handleSyncMessages()
      }
    }, 60000) // 60 segundos = 1 minuto

    return () => clearInterval(interval)
  }, [selectedContactId, isRefreshing])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedContactId) return

    // Mostrar indicador de digitação
    setIsTyping(true)
    
    try {
      await sendMessage(selectedContactId, messageText.trim())
      setMessageText('')
      toast.success('Mensagem enviada!')
    } catch (error) {
      toast.error('Erro ao enviar mensagem')
    } finally {
      setIsTyping(false)
    }
  }

  const handleContactSelect = (contact: RealContact) => {
    setSelectedContactId(contact.id)
    if (isMobileView) {
      // No mobile, esconder a lista de contatos quando selecionar um
    }
  }

  const handleSyncMessages = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await refreshContacts()
      toast.success('Mensagens sincronizadas!')
    } catch (error) {
      toast.error('Erro ao sincronizar mensagens')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker)
  }

  const handleStartCall = (type: 'audio' | 'video') => {
    if (!selectedContact) return
    
    const callUser = {
      id: selectedContact.id,
      name: selectedContact.name,
      photo: selectedContact.avatar,
      username: selectedContact.username
    }
    
    if (type === 'video') {
      startVideoCall(callUser)
    } else {
      startAudioCall(callUser)
    }
    
    toast.success(`Iniciando ${type === 'video' ? 'chamada de vídeo' : 'chamada de áudio'}...`)
  }

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      {/* WhatsApp-style Messages Interface */}
      <div className="h-[calc(100vh-64px)] flex">
        
        {/* Contacts Sidebar */}
        <div className={`${
          isMobileView
            ? selectedContact
              ? 'hidden'
              : 'w-full'
            : 'w-1/3'
        } border-r border-gray-300 bg-white flex flex-col`}>
          
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.photo_url || undefined} alt={profile?.display_name || undefined} />
                    <AvatarFallback>
                      {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-medium text-gray-900">Conversas</h2>
                    <p className="text-xs text-gray-500">
                      {contactStats.online}/{contactStats.total} online
                      {contactStats.unread > 0 && ` • ${contactStats.unread} não lidas`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleSyncMessages}
                    disabled={isRefreshing}
                    title="Sincronizar mensagens"
                    className="transition-all duration-200"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 bg-white border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar ou começar uma nova conversa"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 border-none"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Carregando conversas...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8 px-4">
                <PhoneCall className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">Nenhuma conversa</h3>
                <p className="text-sm text-gray-500 mb-4">Adicione amigos para começar a conversar!</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/buscar'}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Buscar pessoas
                </Button>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors ${
                    selectedContact?.id === contact.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleContactSelect(contact)}
                >
                  <div className="relative">
                    <Avatar className={`h-12 w-12 ${contact.isOnline ? 'ring-2 ring-green-400 ring-offset-1' : ''}`}>
                      <AvatarImage src={contact.avatar} alt={contact.name} />
                      <AvatarFallback>
                        {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {contact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 ml-3 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                        {contact.isOnline && (
                          <span className="text-xs text-green-600 font-medium">•</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {contact.lastMessageTime && formatDistanceToNow(
                          new Date(contact.lastMessageTime),
                          { addSuffix: false, locale: ptBR }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate flex-1 pr-2">
                        {contact.lastMessage}
                      </p>
                      <div className="flex items-center space-x-1">
                        {contact.unreadCount && contact.unreadCount > 0 && (
                          <div className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium">
                            {contact.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${
          isMobileView
            ? selectedContact
              ? 'w-full'
              : 'hidden'
            : 'flex-1'
        } flex flex-col bg-gray-100`}>
          
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isMobileView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedContactId(null)}
                      className="mr-2"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                      <AvatarFallback>
                        {selectedContact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {selectedContact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedContact.name}</h3>
                    <p className="text-xs text-gray-500">
                      {selectedContact.isOnline ? 'online' : selectedContact.lastSeen}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleStartCall('video')}
                    title="Chamada de vídeo"
                    disabled={!selectedContact?.isOnline}
                  >
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleStartCall('audio')}
                    title="Chamada de áudio"
                    disabled={!selectedContact?.isOnline}
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-3"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23f3f4f6' fill-opacity='0.1'%3e%3ccircle cx='30' cy='30' r='2'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
                }}
              >
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <PhoneCall className="h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-gray-500">Nenhuma mensagem ainda</p>
                    <p className="text-sm text-gray-400">Envie a primeira mensagem!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isOwn ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                          message.isOwn
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                        style={{
                          borderRadius: message.isOwn
                            ? '18px 18px 4px 18px'
                            : '18px 18px 18px 4px'
                        }}
                      >
                        <p className="text-sm">{message.text}</p>
                        <div className={`flex items-center justify-end mt-1 space-x-1 ${
                          message.isOwn ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">
                            {formatMessageTime(message.timestamp)}
                          </span>
                          {message.isOwn && (
                            <div className="flex">
                              {message.status === 'sent' && <Check className="h-3 w-3" />}
                              {message.status === 'delivered' && <CheckCheck className="h-3 w-3" />}
                              {message.status === 'read' && <CheckCheck className="h-3 w-3 text-blue-300" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {/* Indicador de digitação */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg max-w-xs">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white px-4 py-3 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-5 w-5 text-gray-500" />
                  </Button>
                  
                  <div className="flex-1 relative" ref={emojiPickerRef}>
                    <Input
                      placeholder="Digite uma mensagem"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage()
                        }
                      }}
                      className="pr-10"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                      onClick={toggleEmojiPicker}
                      title="Adicionar emoji"
                    >
                      <Smile className="h-4 w-4 text-gray-500 hover:text-purple-600 transition-colors" />
                    </Button>
                    
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 w-80 max-h-64 overflow-y-auto">
                        <div className="grid grid-cols-8 gap-2">
                          {/* Emojis populares */}
                          {[
                            '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
                            '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
                            '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
                            '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
                            '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
                            '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
                            '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
                            '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
                            '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
                            '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
                            '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
                            '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
                            '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
                            '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️',
                            '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
                            '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘',
                            '💝', '💟', '♥️', '💯', '💢', '💥', '💫', '💦',
                            '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭',
                            '💤', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌',
                            '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
                            '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊',
                            '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'
                          ].map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => handleEmojiSelect(emoji)}
                              className="p-2 hover:bg-gray-100 rounded-md transition-colors text-lg flex items-center justify-center"
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {messageText.trim() ? (
                    <Button 
                      onClick={handleSendMessage}
                      size="sm" 
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm">
                      <Mic className="h-5 w-5 text-gray-500" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Welcome Screen
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-64 h-64 mx-auto mb-8 flex items-center justify-center">
                  <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 rounded-full p-8 shadow-2xl transform hover:scale-105 transition-all duration-300">
                    <div className="bg-white rounded-full p-6 shadow-lg">
                      <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent orkut-launch-logo">
                        Orkut
                      </span>
                    </div>
                  </div>
                </div>
                <h2 className="text-3xl font-light text-gray-500 mb-4">
                  Orkut Web
                </h2>
                <p className="text-gray-400 max-w-md mx-auto leading-relaxed mb-6">
                  Envie e receba mensagens sem manter seu telefone conectado.
                  Use Orkut em até 4 dispositivos vinculados e 1 telefone ao mesmo tempo.
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                  <RefreshCw className="h-4 w-4" />
                  <span>Sincronização automática ativa</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Central de Chamadas Widget removido - funcionalidades migradas para a interface principal */}
      
      {/* Modal de Chamada */}
      {callState.isOpen && callState.targetUser && callState.callType && (
        <CallModal
          isOpen={callState.isOpen}
          onClose={endCall}
          callType={callState.callType}
          targetUser={callState.targetUser}
        />
      )}
    </div>
  )
}
