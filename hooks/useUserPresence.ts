'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface UserPresence {
  userId: string
  username?: string
  display_name?: string
  photo_url?: string
  isOnline: boolean
  lastSeen: string
  isAvailableForCalls: boolean
  currentActivity?: 'active' | 'away' | 'busy' | 'in-call'
}

export interface PresenceState {
  [userId: string]: UserPresence
}

export function useUserPresence(currentUserId: string) {
  const [presenceState, setPresenceState] = useState<PresenceState>({})
  const [isOnline, setIsOnline] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  /**
   * Detecta atividade do usuário
   */
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    
    if (isOnline && channelRef.current) {
      // Enviar atualização de presença
      channelRef.current.send({
        type: 'broadcast',
        event: 'presence_update',
        payload: {
          userId: currentUserId,
          lastSeen: new Date().toISOString(),
          isAvailableForCalls: true,
          currentActivity: 'active'
        }
      })
    }
  }, [currentUserId, isOnline])

  /**
   * Determina o status de atividade baseado no último movimento
   */
  const getCurrentActivity = useCallback((): UserPresence['currentActivity'] => {
    const timeSinceLastActivity = Date.now() - lastActivityRef.current
    
    if (timeSinceLastActivity < 60000) { // 1 minuto
      return 'active'
    } else if (timeSinceLastActivity < 300000) { // 5 minutos
      return 'away'
    } else {
      return 'away'
    }
  }, [])

  /**
   * Conecta ao sistema de presença
   */
  const connectToPresence = useCallback(async () => {
    if (!currentUserId || channelRef.current) return

    console.log('🟢 Conectando ao sistema de presença:', currentUserId)

    const channel = supabase.channel('user_presence', {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    })

    // Escutar mudanças de presença
    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('🔄 Sincronizando presenças')
        const state = channel.presenceState()
        
        const newPresenceState: PresenceState = {}
        
        Object.entries(state).forEach(([userId, presences]) => {
          // Pegar a presença mais recente
          const presence = (presences as any[])[0]
          if (presence) {
            newPresenceState[userId] = {
              userId,
              username: presence.username,
              display_name: presence.display_name,
              photo_url: presence.photo_url,
              isOnline: true,
              lastSeen: presence.lastSeen || new Date().toISOString(),
              isAvailableForCalls: presence.isAvailableForCalls || true,
              currentActivity: presence.currentActivity || 'active'
            }
          }
        })
        
        setPresenceState(newPresenceState)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 Usuário entrou online:', key)
        const presence = newPresences[0]
        if (presence) {
          setPresenceState(prev => ({
            ...prev,
            [key]: {
              userId: key,
              username: presence.username,
              display_name: presence.display_name,
              photo_url: presence.photo_url,
              isOnline: true,
              lastSeen: presence.lastSeen || new Date().toISOString(),
              isAvailableForCalls: presence.isAvailableForCalls || true,
              currentActivity: presence.currentActivity || 'active'
            }
          }))
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('👋 Usuário saiu offline:', key)
        setPresenceState(prev => ({
          ...prev,
          [key]: prev[key] ? {
            ...prev[key],
            isOnline: false,
            lastSeen: new Date().toISOString(),
            currentActivity: undefined
          } : prev[key]
        }))
      })
      .on('broadcast', { event: 'presence_update' }, ({ payload }) => {
        const { userId, lastSeen, isAvailableForCalls, currentActivity } = payload
        
        setPresenceState(prev => ({
          ...prev,
          [userId]: prev[userId] ? {
            ...prev[userId],
            lastSeen,
            isAvailableForCalls,
            currentActivity
          } : prev[userId]
        }))
      })

    try {
      const status = await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Conectado ao sistema de presença')
          
          // Enviar presença inicial
          const userInfo = await getUserInfo(currentUserId)
          await channel.track({
            userId: currentUserId,
            username: userInfo?.username,
            display_name: userInfo?.display_name,
            photo_url: userInfo?.photo_url,
            lastSeen: new Date().toISOString(),
            isAvailableForCalls: true,
            currentActivity: getCurrentActivity()
          })
          
          setIsOnline(true)
        }
      })

      channelRef.current = channel

      // Heartbeat para manter presença ativa
      heartbeatRef.current = setInterval(async () => {
        if (channelRef.current) {
          const userInfo = await getUserInfo(currentUserId)
          await channelRef.current.track({
            userId: currentUserId,
            username: userInfo?.username,
            display_name: userInfo?.display_name,
            photo_url: userInfo?.photo_url,
            lastSeen: new Date().toISOString(),
            isAvailableForCalls: true,
            currentActivity: getCurrentActivity()
          })
        }
      }, 30000) // Atualizar a cada 30 segundos

    } catch (error) {
      console.error('❌ Erro ao conectar presença:', error)
    }
  }, [currentUserId, getCurrentActivity])

  /**
   * Busca informações do usuário
   */
  const getUserInfo = async (userId: string) => {
    // Dados fictícios para usuários de teste
    const testUsers = {
      user_1: {
        username: 'teste_user1',
        display_name: 'João Silva',
        photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      user_2: {
        username: 'teste_user2',
        display_name: 'Maria Santos',
        photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      },
      user_3: {
        username: 'teste_user3',
        display_name: 'Pedro Costa',
        photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
      }
    }

    // Se for usuário de teste, retornar dados fictícios
    if (userId.startsWith('user_') && testUsers[userId as keyof typeof testUsers]) {
      return testUsers[userId as keyof typeof testUsers]
    }

    // Caso contrário, buscar no banco de dados
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username, display_name, photo_url')
        .eq('id', userId)
        .single()
      
      return data
    } catch (error) {
      console.warn('Não foi possível buscar info do usuário:', userId)
      return null
    }
  }

  /**
   * Desconecta do sistema de presença
   */
  const disconnectFromPresence = useCallback(() => {
    console.log('🔴 Desconectando do sistema de presença')
    
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    setIsOnline(false)
    setPresenceState({})
  }, [])

  /**
   * Atualiza status de disponibilidade para chamadas
   */
  const setAvailableForCalls = useCallback(async (available: boolean) => {
    if (!channelRef.current) return

    await channelRef.current.track({
      userId: currentUserId,
      lastSeen: new Date().toISOString(),
      isAvailableForCalls: available,
      currentActivity: available ? getCurrentActivity() : 'busy'
    })
  }, [currentUserId, getCurrentActivity])

  /**
   * Marca usuário como em chamada
   */
  const setInCall = useCallback(async (inCall: boolean) => {
    if (!channelRef.current) return

    await channelRef.current.track({
      userId: currentUserId,
      lastSeen: new Date().toISOString(),
      isAvailableForCalls: !inCall,
      currentActivity: inCall ? 'in-call' : getCurrentActivity()
    })
  }, [currentUserId, getCurrentActivity])

  /**
   * Obtém lista de usuários online
   */
  const getOnlineUsers = useCallback(() => {
    return Object.values(presenceState).filter(user => user.isOnline)
  }, [presenceState])

  /**
   * Obtém usuários disponíveis para chamadas
   */
  const getAvailableUsers = useCallback(() => {
    return getOnlineUsers().filter(user => 
      user.isAvailableForCalls && 
      user.currentActivity !== 'in-call' &&
      user.userId !== currentUserId
    )
  }, [getOnlineUsers, currentUserId])

  /**
   * Verifica se um usuário específico está online
   */
  const isUserOnline = useCallback((userId: string) => {
    return presenceState[userId]?.isOnline || false
  }, [presenceState])

  /**
   * Verifica se um usuário está disponível para chamadas
   */
  const isUserAvailableForCalls = useCallback((userId: string) => {
    const user = presenceState[userId]
    return user?.isOnline && user?.isAvailableForCalls && user?.currentActivity !== 'in-call'
  }, [presenceState])

  // Conectar ao montar e detectar atividade
  useEffect(() => {
    connectToPresence()

    // Detectar atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    // Detectar quando a aba fica inativa
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAvailableForCalls(false)
      } else {
        setAvailableForCalls(true)
        updateActivity()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      disconnectFromPresence()
      
      events.forEach(event => {
        document.removeEventListener(event, updateActivity)
      })
      
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connectToPresence, disconnectFromPresence, updateActivity, setAvailableForCalls])

  return {
    presenceState,
    isOnline,
    getOnlineUsers,
    getAvailableUsers,
    isUserOnline,
    isUserAvailableForCalls,
    setAvailableForCalls,
    setInCall,
    updateActivity
  }
}
