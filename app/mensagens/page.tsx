'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
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
  Mic
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Contact {
  id: string
  name: string
  username: string
  avatar: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
  isOnline: boolean
  lastSeen?: string
}

interface Message {
  id: string
  text: string
  timestamp: Date
  senderId: string
  isOwn: boolean
  status: 'sent' | 'delivered' | 'read'
}

export default function MensagensPage() {
  const { user, profile } = useAuth()
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isMobileView, setIsMobileView] = useState(false)

  // Demo contacts
  const [contacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'Ana Carolina',
      username: 'ana_carolina',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
      lastMessage: 'Oi! Como você está?',
      lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      unreadCount: 2,
      isOnline: true
    },
    {
      id: '2',
      name: 'Carlos Eduardo',
      username: 'carlos_edu',
      avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100',
      lastMessage: 'Vamos marcar aquele encontro!',
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
      isOnline: false,
      lastSeen: 'visto por último hoje às 14:30'
    },
    {
      id: '3',
      name: 'Mariana Silva',
      username: 'mariana_silva',
      avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100',
      lastMessage: '😂😂😂',
      lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 1,
      isOnline: true
    },
    {
      id: '4',
      name: 'João Santos',
      username: 'joao_santos',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
      lastMessage: 'Valeu pela ajuda ontem!',
      lastMessageTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
      isOnline: false,
      lastSeen: 'visto por último anteontem às 22:15'
    },
    {
      id: '5',
      name: 'Patricia Lima',
      username: 'patricia_lima',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
      lastMessage: 'Que bom te ver por aqui!',
      lastMessageTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
      isOnline: true
    }
  ])

  // Demo messages for selected contact
  const demoMessages: Record<string, Message[]> = {
    '1': [
      {
        id: '1',
        text: 'Oi! Tudo bem?',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        senderId: '1',
        isOwn: false,
        status: 'read'
      },
      {
        id: '2',
        text: 'Oi Ana! Tudo ótimo por aqui, e com você?',
        timestamp: new Date(Date.now() - 58 * 60 * 1000),
        senderId: 'me',
        isOwn: true,
        status: 'read'
      },
      {
        id: '3',
        text: 'Também tudo bem! Que bom ver você no Orkut de novo! 😊',
        timestamp: new Date(Date.now() - 55 * 60 * 1000),
        senderId: '1',
        isOwn: false,
        status: 'read'
      },
      {
        id: '4',
        text: 'Verdade! Essa nostalgia está incrível! Como está a vida?',
        timestamp: new Date(Date.now() - 50 * 60 * 1000),
        senderId: 'me',
        isOwn: true,
        status: 'read'
      },
      {
        id: '5',
        text: 'Oi! Como você está?',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        senderId: '1',
        isOwn: false,
        status: 'delivered'
      }
    ]
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
    if (selectedContact) {
      setMessages(demoMessages[selectedContact.id] || [])
    }
  }, [selectedContact])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedContact) return

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText.trim(),
      timestamp: new Date(),
      senderId: 'me',
      isOwn: true,
      status: 'sent'
    }

    setMessages(prev => [...prev, newMessage])
    setMessageText('')

    // Simular resposta automática
    setTimeout(() => {
      const autoReply: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Obrigado pela mensagem! Esta é uma resposta automática de demonstração.',
        timestamp: new Date(),
        senderId: selectedContact.id,
        isOwn: false,
        status: 'delivered'
      }
      setMessages(prev => [...prev, autoReply])
    }, 1000)
  }

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact)
    if (isMobileView) {
      // No mobile, esconder a lista de contatos quando selecionar um
    }
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
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-5 w-5" />
              </Button>
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
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  selectedContact?.id === contact.id ? 'bg-gray-100' : ''
                }`}
                onClick={() => handleContactSelect(contact)}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={contact.avatar} alt={contact.name} />
                    <AvatarFallback>
                      {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {contact.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                <div className="flex-1 ml-3 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                    <span className="text-xs text-gray-500">
                      {contact.lastMessageTime && formatDistanceToNow(
                        new Date(contact.lastMessageTime),
                        { addSuffix: false, locale: ptBR }
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 truncate">
                      {contact.lastMessage}
                    </p>
                    {contact.unreadCount && contact.unreadCount > 0 && (
                      <div className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {contact.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                      onClick={() => setSelectedContact(null)}
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
                  <Button variant="ghost" size="sm">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm">
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
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isOwn ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isOwn
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-gray-800'
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
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white px-4 py-3 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-5 w-5 text-gray-500" />
                  </Button>
                  
                  <div className="flex-1 relative">
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
                    >
                      <Smile className="h-4 w-4 text-gray-500" />
                    </Button>
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
                <div className="w-64 h-64 mx-auto mb-8 opacity-20">
                  <svg viewBox="0 0 303 172" className="w-full h-full">
                    <g fill="#9ca3af">
                      <path d="M78.9 154.9c-.8-1.1-1.5-2.2-2.2-3.4-3.5-6.1-5.4-13.1-5.4-20.4 0-7.3 1.9-14.3 5.4-20.4.7-1.2 1.4-2.3 2.2-3.4L67 95.4c-1.5 2.4-2.8 4.9-3.9 7.5-2.2 5.1-3.4 10.6-3.4 16.3 0 5.7 1.2 11.2 3.4 16.3 1.1 2.6 2.4 5.1 3.9 7.5l11.9-11.9z"/>
                      <path d="M302.9 85.3L218.6 1c-.8-.8-1.8-1.4-2.9-1.8L193.4 10l4.4 4.4 99 99-4.4 4.4 21.3 21.3c.4-1.1 1-2.1 1.8-2.9l84.3-84.3c2.3-2.3 2.3-6.1 0-8.4l-2-2c-2.3-2.3-6.1-2.3-8.4 0z"/>
                    </g>
                  </svg>
                </div>
                <h2 className="text-3xl font-light text-gray-500 mb-4">
                  Orkut Web
                </h2>
                <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                  Envie e receba mensagens sem manter seu telefone conectado.
                  Use Orkut em até 4 dispositivos vinculados e 1 telefone ao mesmo tempo.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
