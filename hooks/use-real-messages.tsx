'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface RealContact {
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

export interface RealMessage {
  id: string
  text: string
  timestamp: Date
  senderId: string
  receiverId: string
  isOwn: boolean
  status: 'sent' | 'delivered' | 'read'
  type: 'text' | 'image' | 'file'
  metadata?: any
}

export function useRealMessages() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<RealContact[]>([])
  const [messages, setMessages] = useState<RealMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)

  // Carregar amigos reais do usuário
  const loadContacts = useCallback(async () => {
    if (!user) {
      // Se não há usuário logado, mostrar contatos demo
      const demoContacts: RealContact[] = [
        {
          id: 'demo1',
          name: 'Ana Carolina',
          username: 'ana_carolina',
          avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
          lastMessage: 'Oi! Como você está?',
          lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          unreadCount: 2,
          isOnline: true
        },
        {
          id: 'demo2',
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
          id: 'demo3',
          name: 'Mariana Silva',
          username: 'mariana_silva',
          avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100',
          lastMessage: '😂😂😂',
          lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          unreadCount: 1,
          isOnline: true
        }
      ]
      setContacts(demoContacts)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Buscar amizades aceitas
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!requester_id(id, username, display_name, photo_url),
          addressee:profiles!addressee_id(id, username, display_name, photo_url)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })

      if (friendshipsError) throw friendshipsError

      const realContacts: RealContact[] = []

      for (const friendship of friendships || []) {
        const friend = friendship.requester_id === user.id 
          ? friendship.addressee 
          : friendship.requester

        if (!friend) continue

        // Buscar última mensagem com este amigo
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('*')
          .or(`and(from_profile_id.eq.${user.id},to_profile_id.eq.${friend.id}),and(from_profile_id.eq.${friend.id},to_profile_id.eq.${user.id})`)
          .order('created_at', { ascending: false })
          .limit(1)

        const lastMessage = lastMessages?.[0]
        
        // Contar mensagens não lidas
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('from_profile_id', friend.id)
          .eq('to_profile_id', user.id)
          .is('read_at', null)

        realContacts.push({
          id: friend.id,
          name: friend.display_name,
          username: friend.username,
          avatar: friend.photo_url || `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo-${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=100`,
          lastMessage: lastMessage?.content || 'Começar conversa',
          lastMessageTime: lastMessage?.created_at,
          unreadCount: unreadCount || 0,
          isOnline: Math.random() > 0.3, // 70% chance de estar online
          lastSeen: Math.random() > 0.3 ? undefined : `visto por último ${Math.floor(Math.random() * 60)} min atrás`
        })
      }

      // Se não houver amigos reais, adicionar alguns contatos demo
      console.log('🔍 [DEBUG] Total de contatos reais processados:', realContacts.length)
      if (realContacts.length === 0) {
        console.log('🔍 [DEBUG] Nenhum contato real, adicionando demos')
        const demoContacts: RealContact[] = [
          {
            id: 'demo1',
            name: 'Ana Carolina',
            username: 'ana_carolina',
            avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
            lastMessage: 'Oi! Como você está?',
            lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            unreadCount: 2,
            isOnline: true
          },
          {
            id: 'demo2',
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
            id: 'demo3',
            name: 'Mariana Silva',
            username: 'mariana_silva',
            avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100',
            lastMessage: '😂😂😂',
            lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            unreadCount: 1,
            isOnline: true
          }
        ]
        realContacts.push(...demoContacts)
      }

      setContacts(realContacts)
      console.log('✅ [DEBUG] Contatos definidos no state:', realContacts.length)
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao carregar contatos:', error)
      toast.error('Erro ao carregar conversas')
    } finally {
      setLoading(false)
      console.log('🔍 [DEBUG] loadContacts finalizado')
    }
  }, [user])

  // Carregar mensagens de uma conversa específica
  const loadMessages = useCallback(async (contactId: string) => {
    console.log('🔍 [DEBUG] loadMessages chamada:', { contactId, user: !!user })
    
    if (!user || !contactId) {
      console.log('⚠️ [DEBUG] loadMessages: sem user ou contactId')
      return
    }

    try {
      setLoadingMessages(true)
      console.log('🔍 [DEBUG] Iniciando carregamento de mensagens...')
      
      // Se for contato demo, usar mensagens demo
      if (contactId.startsWith('demo')) {
        const demoMessages: RealMessage[] = [
          {
            id: '1',
            text: 'Oi! Tudo bem?',
            timestamp: new Date(Date.now() - 60 * 60 * 1000),
            senderId: contactId,
            receiverId: user.id,
            isOwn: false,
            status: 'read',
            type: 'text'
          },
          {
            id: '2',
            text: 'Oi! Tudo ótimo por aqui, e com você?',
            timestamp: new Date(Date.now() - 58 * 60 * 1000),
            senderId: user.id,
            receiverId: contactId,
            isOwn: true,
            status: 'read',
            type: 'text'
          },
          {
            id: '3',
            text: 'Também tudo bem! Que bom ver você no Orkut de novo! 😊',
            timestamp: new Date(Date.now() - 55 * 60 * 1000),
            senderId: contactId,
            receiverId: user.id,
            isOwn: false,
            status: 'read',
            type: 'text'
          }
        ]
        setMessages(demoMessages)
        return
      }

      // Carregar mensagens reais do Supabase
      const query = `and(from_profile_id.eq.${user.id},to_profile_id.eq.${contactId}),and(from_profile_id.eq.${contactId},to_profile_id.eq.${user.id})`
      console.log('🔍 [DEBUG] Query de mensagens:', query)
      
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(query)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ [DEBUG] Erro ao buscar mensagens:', error)
        throw error
      }
      
      console.log('✅ [DEBUG] Mensagens encontradas:', messagesData?.length || 0)

      const realMessages: RealMessage[] = messagesData?.map(msg => ({
        id: msg.id.toString(),
        text: msg.content,
        timestamp: new Date(msg.created_at),
        senderId: msg.from_profile_id,
        receiverId: msg.to_profile_id,
        isOwn: msg.from_profile_id === user.id,
        status: msg.read_at ? 'read' : 'delivered',
        type: 'text', // Campo type não existe na tabela, assumindo texto
        metadata: null
      })) || []

      setMessages(realMessages)
      console.log('✅ [DEBUG] Mensagens definidas no state:', realMessages.length)

      // Marcar mensagens como lidas
      if (realMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('from_profile_id', contactId)
          .eq('to_profile_id', user.id)
          .is('read_at', null)
      }

    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
      toast.error('Erro ao carregar mensagens')
    } finally {
      setLoadingMessages(false)
    }
  }, [user])

  // Enviar mensagem
  const sendMessage = useCallback(async (contactId: string, text: string) => {
    if (!user || !contactId || !text.trim()) return

    try {
      const messageId = Date.now().toString()
      const newMessage: RealMessage = {
        id: messageId,
        text: text.trim(),
        timestamp: new Date(),
        senderId: user.id,
        receiverId: contactId,
        isOwn: true,
        status: 'sent',
        type: 'text'
      }

      // Adicionar mensagem localmente primeiro
      setMessages(prev => [...prev, newMessage])

      // Se for contato demo, simular resposta
      if (contactId.startsWith('demo')) {
        setTimeout(() => {
          const autoReply: RealMessage = {
            id: (Date.now() + 1).toString(),
            text: 'Obrigado pela mensagem! Esta é uma resposta automática de demonstração.',
            timestamp: new Date(),
            senderId: contactId,
            receiverId: user.id,
            isOwn: false,
            status: 'delivered',
            type: 'text'
          }
          setMessages(prev => [...prev, autoReply])
        }, 1000)
        return
      }

      // Salvar mensagem real no Supabase
      const { error } = await supabase
        .from('messages')
        .insert({
          from_profile_id: user.id,
          to_profile_id: contactId,
          content: text.trim()
        })

      if (error) throw error

      // Atualizar status para entregue após um delay
      setTimeout(async () => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'delivered' } : msg
        ))
      }, 1000)

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
    }
  }, [user])

  // Efeitos
  useEffect(() => {
    // Sempre carregar contatos, mesmo sem usuário logado (para mostrar demo)
    loadContacts()
  }, [user, loadContacts])

  useEffect(() => {
    if (selectedContactId) {
      loadMessages(selectedContactId)
    }
  }, [selectedContactId, loadMessages])

  return {
    contacts,
    messages,
    loading,
    loadingMessages,
    selectedContactId,
    setSelectedContactId,
    sendMessage,
    refreshContacts: loadContacts,
    refreshMessages: () => selectedContactId ? loadMessages(selectedContactId) : null
  }
}
