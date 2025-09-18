'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/local-auth-context'

interface ProfileData {
  profile: any | null
  friendshipStatus: string
  friends: any[]
  recentConversations: any[]
  userPosts: any[]
  socialData: any
}

interface CacheEntry {
  data: ProfileData
  timestamp: number
  expires: number
}

// Cache global para evitar consultas duplicadas
const profileCache = new Map<string, CacheEntry>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export function useOptimizedProfile(username: string) {
  const { user: currentUser, profile: currentUserProfile } = useAuth()
  
  const [data, setData] = useState<ProfileData>({
    profile: null,
    friendshipStatus: 'none',
    friends: [],
    recentConversations: [],
    userPosts: [],
    socialData: {}
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para verificar cache
  const getCachedData = useCallback((key: string): ProfileData | null => {
    const cached = profileCache.get(key)
    if (cached && Date.now() < cached.expires) {
      console.log('📋 Usando dados do cache para:', key)
      return cached.data
    }
    return null
  }, [])

  // Função para salvar no cache
  const setCachedData = useCallback((key: string, profileData: ProfileData) => {
    const entry: CacheEntry = {
      data: profileData,
      timestamp: Date.now(),
      expires: Date.now() + CACHE_DURATION
    }
    profileCache.set(key, entry)
    console.log('💾 Dados salvos no cache para:', key)
  }, [])

  // Função otimizada para carregar todos os dados de uma vez
  const loadAllProfileData = useCallback(async () => {
    if (!username) return
    
    const cacheKey = `profile_${username}_${currentUser?.id || 'anonymous'}`
    
    // Verificar cache primeiro
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      setData(cachedData)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Carregando dados do perfil (otimizado):', username)

      // 1. Buscar perfil básico
      let profileData = null
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single()

        if (!profileError && profile) {
          profileData = profile
        }
      } catch (e) {
        console.log('⚠️ Erro ao buscar perfil no Supabase, usando fallback')
      }

      // Fallback para perfis específicos
      if (!profileData) {
        if (username === 'radiotatuapefm') {
          profileData = {
            id: 'radio-tatuape-fm-oficial',
            display_name: 'Rádio Tatuapé FM',
            username: 'radiotatuapefm',
            email: 'radiotatuapefm@gmail.com',
            photo_url: '/logoradiotatuapefm.png',
            phone: '11970603441',
            bio: 'Rádio Tatuapé FM Classic Rock, Hard Rock, 70s, 80s, 90s, Heavy Metal tradicional, Raridades, B-Sides e bandas atuais com influência sonora dos anos 80.',
            location: 'São Paulo, SP',
            whatsapp_enabled: true,
            fans_count: 0,
            created_at: '2024-01-01T00:00:00Z'
          }
        }
      }

      if (!profileData) {
        setError('Perfil não encontrado')
        return
      }

      // Preparar objeto de dados
      const resultData: ProfileData = {
        profile: profileData,
        friendshipStatus: 'none',
        friends: [],
        recentConversations: [],
        userPosts: [],
        socialData: {}
      }

      // 2. Se o usuário estiver logado, fazer consultas relacionadas em paralelo
      if (currentUser?.id && profileData.id) {
        const queries = []

        // Query de amizade
        if (currentUser.id !== profileData.id) {
          const friendshipQuery = supabase
            .from('friendships')
            .select('*')
            .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${profileData.id}),and(requester_id.eq.${profileData.id},addressee_id.eq.${currentUser.id})`)
            .maybeSingle()
          queries.push(friendshipQuery)
        } else {
          queries.push(Promise.resolve({ data: null, error: null }))
        }

        // Query de amigos (Top 10)
        const friendsQuery = supabase
          .from('friendships')
          .select(`
            *,
            requester:profiles!requester_id(id, username, display_name, photo_url),
            addressee:profiles!addressee_id(id, username, display_name, photo_url)
          `)
          .or(`requester_id.eq.${profileData.id},addressee_id.eq.${profileData.id}`)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false })
          .limit(10)
        queries.push(friendsQuery)

        // Query de conversas recentes (apenas se for o próprio perfil ou amigo)
        const conversationsQuery = supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            from_profile_id,
            to_profile_id,
            read_at,
            from_profile:profiles!from_profile_id(id, username, display_name, photo_url),
            to_profile:profiles!to_profile_id(id, username, display_name, photo_url)
          `)
          .or(`from_profile_id.eq.${currentUser.id},to_profile_id.eq.${currentUser.id}`)
          .order('created_at', { ascending: false })
          .limit(20)
        queries.push(conversationsQuery)

        // Query de posts do usuário
        const userPostsQuery = fetch(`/api/posts-db?user_id=${profileData.id}&profile_posts=true&limit=10`, {
          method: 'GET',
          cache: 'no-store'
        }).then(res => res.json())
        queries.push(userPostsQuery)

        // Executar todas as queries em paralelo
        try {
          const [
            friendshipResult,
            friendsResult,
            conversationsResult,
            postsResult
          ] = await Promise.allSettled(queries)

          // Processar resultado de amizade
          if (friendshipResult.status === 'fulfilled' && friendshipResult.value.data) {
            resultData.friendshipStatus = friendshipResult.value.data.status
          }

          // Processar amigos
          if (friendsResult.status === 'fulfilled' && friendsResult.value.data) {
            resultData.friends = friendsResult.value.data.map((friendship: any) => {
              const friend = friendship.requester_id === profileData.id 
                ? friendship.addressee 
                : friendship.requester
              return {
                id: friend.id,
                name: friend.display_name,
                avatar: friend.photo_url
              }
            })
          }

          // Processar conversas
          if (conversationsResult.status === 'fulfilled' && conversationsResult.value.data) {
            const messages = conversationsResult.value.data
            const conversationsMap = new Map()
            
            messages.forEach((message: any) => {
              const otherUser = message.from_profile_id === currentUser.id 
                ? message.to_profile 
                : message.from_profile
              
              if (!conversationsMap.has(otherUser.id)) {
                conversationsMap.set(otherUser.id, {
                  id: otherUser.id,
                  userId: otherUser.id,
                  userName: otherUser.display_name,
                  userUsername: otherUser.username,
                  userPhoto: otherUser.photo_url,
                  lastMessage: message.content,
                  lastMessageDate: message.created_at,
                  unreadCount: 0,
                  isOnline: Math.random() > 0.5
                })
              }
            })
            
            resultData.recentConversations = Array.from(conversationsMap.values()).slice(0, 5)
          }

          // Processar posts
          if (postsResult.status === 'fulfilled' && postsResult.value.success) {
            resultData.userPosts = postsResult.value.posts?.slice(0, 10) || []
          }

        } catch (queriesError) {
          console.log('⚠️ Algumas consultas falharam, usando dados parciais:', queriesError)
        }
      }

      // Salvar no cache e definir estado
      setCachedData(cacheKey, resultData)
      setData(resultData)
      console.log('✅ Dados do perfil carregados com sucesso:', resultData)

    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error)
      setError('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }, [username, currentUser?.id, getCachedData, setCachedData])

  // Função para atualizar cache quando necessário
  const invalidateCache = useCallback(() => {
    const cacheKey = `profile_${username}_${currentUser?.id || 'anonymous'}`
    profileCache.delete(cacheKey)
    console.log('🗑️ Cache invalidado para:', cacheKey)
  }, [username, currentUser?.id])

  // Recarregar dados quando username ou usuário mudar
  useEffect(() => {
    if (username) {
      loadAllProfileData()
    }
  }, [username, loadAllProfileData])

  return {
    ...data,
    loading,
    error,
    reload: loadAllProfileData,
    invalidateCache
  }
}
