import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getOrkutDB, type OrkutPasteDBAdapter } from './orkut-pastedb-adapter'

// Configuração do sistema de banco de dados
// IMPORTANTE: Usar Supabase para auth, PasteDB apenas para dados
const USE_PASTEDB_FOR_DATA = process.env.NEXT_PUBLIC_USE_PASTEDB_FOR_DATA === 'true' || true
const USE_SUPABASE_FOR_AUTH = process.env.NEXT_PUBLIC_USE_SUPABASE_FOR_AUTH === 'true' || true
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

// 🚀 ADAPTADOR PASTEDB - Cliente revolucionário que intercepta calls do Supabase
const createPasteDBClient = (): SupabaseClient => {
  const orkutDB = getOrkutDB()
  
  // Interceptar e redirecionar operações para PasteDB
  const createMockChain = (tableName: string) => ({
    select: (columns?: string, options?: any) => ({
      ...createMockChain(tableName),
      eq: (column: string, value: any) => ({
        ...createMockChain(tableName),
        single: async () => {
          try {
            if (tableName === 'profiles') {
              const profile = await orkutDB.getProfile(value)
              return { data: profile, error: null }
            }
            if (tableName === 'posts' && column === 'id') {
              const post = await orkutDB.getPost(value)
              return { data: post, error: null }
            }
            return { data: null, error: null }
          } catch (error) {
            return { data: null, error: { message: 'PasteDB error: ' + error } }
          }
        },
        limit: (count: number) => ({
          ...createMockChain(tableName),
          then: async (callback: Function) => {
            try {
              let data = []
              if (tableName === 'posts') {
                data = await orkutDB.getFeedPosts(count)
              } else if (tableName === 'communities') {
                data = await orkutDB.getCommunities(count)
              }
              callback({ data, error: null })
            } catch (error) {
              callback({ data: [], error: { message: 'PasteDB error: ' + error } })
            }
          }
        })
      }),
      order: (column: string, options?: any) => createMockChain(tableName),
      range: (from: number, to: number) => createMockChain(tableName),
      limit: (count: number) => ({
        ...createMockChain(tableName),
        then: async (callback: Function) => {
          try {
            let data = []
            if (tableName === 'posts') {
              data = await orkutDB.getFeedPosts(count)
            } else if (tableName === 'communities') {
              data = await orkutDB.getCommunities(count)
            }
            callback({ data, error: null })
          } catch (error) {
            callback({ data: [], error: { message: 'PasteDB error: ' + error } })
          }
        }
      })
    }),
    insert: (values: any) => ({
      ...createMockChain(tableName),
      select: () => ({
        ...createMockChain(tableName),
        single: async () => {
          try {
            let result = null
            if (tableName === 'profiles') {
              const success = await orkutDB.createProfile(values)
              result = success ? values : null
            } else if (tableName === 'posts') {
              result = await orkutDB.createPost(values)
            }
            return { data: result, error: result ? null : { message: 'Insert failed' } }
          } catch (error) {
            return { data: null, error: { message: 'PasteDB insert error: ' + error } }
          }
        }
      })
    }),
    update: (values: any) => ({
      ...createMockChain(tableName),
      eq: (column: string, value: any) => ({
        ...createMockChain(tableName),
        then: async (callback: Function) => {
          try {
            let success = false
            if (tableName === 'profiles') {
              success = await orkutDB.updateProfile(value, values)
            }
            callback({ data: success ? [values] : [], error: success ? null : { message: 'Update failed' } })
          } catch (error) {
            callback({ data: [], error: { message: 'PasteDB update error: ' + error } })
          }
        }
      })
    }),
    delete: () => createMockChain(tableName),
    upsert: (values: any) => createMockChain(tableName),
    then: async (callback: Function) => {
      // Fallback para operações gerais
      try {
        let data = []
        if (tableName === 'posts') {
          data = await orkutDB.getFeedPosts(20)
        } else if (tableName === 'communities') {
          data = await orkutDB.getCommunities(50)
        }
        callback({ data, error: null })
      } catch (error) {
        callback({ data: [], error: { message: 'PasteDB error: ' + error } })
      }
    }
  })
  
  // Criar cliente Supabase real para autenticação
  const realSupabaseClient = (supabaseUrl && supabaseAnonKey) ? 
    createClient(supabaseUrl, supabaseAnonKey) : null
  
  return {
    from: (tableName: string) => createMockChain(tableName),
    // USAR SUPABASE REAL PARA AUTENTICAÇÃO
    auth: realSupabaseClient ? realSupabaseClient.auth : {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signInWithOAuth: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null })
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Storage not implemented in PasteDB' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        download: () => Promise.resolve({ data: null, error: { message: 'Storage not implemented in PasteDB' } }),
        remove: () => Promise.resolve({ data: null, error: null })
      })
    },
    channel: () => ({
      on: () => ({}),
      subscribe: () => ({}),
      unsubscribe: () => ({})
    }),
    removeChannel: () => {},
    rpc: () => Promise.resolve({ data: null, error: { message: 'RPC not implemented in PasteDB' } })
  } as any
}

// Cliente mock original para fallback
const createMockClient = (): SupabaseClient => {
  const mockFunction = () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } })
  const mockSuccessFunction = () => Promise.resolve({ data: [], error: null })
  
  // Mock chain que retorna mais mocks
  const createMockChain = () => ({
    select: () => createMockChain(),
    insert: () => createMockChain(),
    update: () => createMockChain(),
    delete: () => createMockChain(),
    upsert: () => createMockChain(),
    eq: () => createMockChain(),
    or: () => createMockChain(),
    neq: () => createMockChain(),
    limit: () => createMockChain(),
    order: () => createMockChain(),
    ilike: () => createMockChain(),
    single: () => mockFunction(),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (callback: Function) => callback({ data: null, error: null })
  })
  
  return {
    from: () => createMockChain(),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => mockFunction(),
      signInWithOAuth: () => mockFunction(),
      signUp: () => mockFunction(),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null })
    },
    storage: {
      from: () => ({
        upload: () => mockFunction(),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        download: () => mockFunction(),
        remove: () => mockFunction()
      })
    },
    channel: () => ({
      on: () => ({}),
      subscribe: () => ({}),
      unsubscribe: () => ({})
    }),
    removeChannel: () => {},
    rpc: () => mockFunction()
  } as any
}

// 🚀 SISTEMA HÍBRIDO: Supabase para Auth + PasteDB para Dados
const createSupabaseClient = (): SupabaseClient => {
  // Se PasteDB estiver habilitado para dados, usar o adaptador híbrido
  if (USE_PASTEDB_FOR_DATA && USE_SUPABASE_FOR_AUTH) {
    console.log('🚀 Usando sistema híbrido: Supabase Auth + PasteDB Dados!')
    return createPasteDBClient()
  }
  
  // Fallback para Supabase tradicional
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl.includes('placeholder') || 
      supabaseUrl.includes('your_') ||
      !supabaseUrl.startsWith('https://')) {
    console.warn('Supabase não configurado - usando cliente mock')
    return createMockClient()
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
  })
}

export const supabase = createSupabaseClient()

// Exportar também o adaptador PasteDB para uso direto
export const pasteDB = USE_PASTEDB_FOR_DATA ? getOrkutDB() : null

// Função para alternar entre backends
export const switchToSupabase = () => {
  console.log('🔄 Alternando para backend Supabase...')
  // TODO: Implementar troca dinâmica de backend
}

export const switchToPasteDB = () => {
  console.log('🚀 Alternando para backend PasteDB...')
  // TODO: Implementar troca dinâmica de backend
}

// Função para verificar qual backend está ativo
export const getActiveBackend = () => {
  return USE_PASTEDB_FOR_DATA ? 'Híbrido (Supabase Auth + PasteDB Data)' : 'Supabase Completo'
}

// Função para inicializar sistema (chamada na inicialização da app)
export const initializeDatabase = async () => {
  if (USE_PASTEDB_FOR_DATA && pasteDB) {
    try {
      await pasteDB.initialize()
      console.log('✅ PasteDB inicializado com sucesso para dados!')
    } catch (error) {
      console.error('❌ Erro ao inicializar PasteDB:', error)
    }
  }
  
  if (USE_SUPABASE_FOR_AUTH) {
    console.log('✅ Supabase configurado para autenticação!')
  }
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          photo_url: string | null
          relationship: string | null
          location: string | null
          birthday: string | null
          bio: string | null
          fans_count: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          username: string
          display_name: string
          photo_url?: string | null
          relationship?: string | null
          location?: string | null
          birthday?: string | null
          bio?: string | null
          fans_count?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          photo_url?: string | null
          relationship?: string | null
          location?: string | null
          birthday?: string | null
          bio?: string | null
          fans_count?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      posts: {
        Row: {
          id: number
          author: string
          author_name: string
          author_photo: string | null
          content: string
          visibility: 'public' | 'friends'
          likes_count: number
          comments_count: number
          shares_count: number
          is_dj_post: boolean | null
          created_at: string
        }
        Insert: {
          author: string
          author_name: string
          author_photo?: string | null
          content: string
          visibility?: 'public' | 'friends'
          likes_count?: number
          comments_count?: number
          shares_count?: number
          is_dj_post?: boolean | null
          created_at?: string
        }
        Update: {
          author?: string
          author_name?: string
          author_photo?: string | null
          content?: string
          visibility?: 'public' | 'friends'
          likes_count?: number
          comments_count?: number
          shares_count?: number
          is_dj_post?: boolean | null
          created_at?: string
        }
      }
      communities: {
        Row: {
          id: number
          name: string
          description: string
          category: string
          owner: string | null
          members_count: number
          photo_url: string | null
          created_at: string
        }
        Insert: {
          name: string
          description?: string
          category?: string
          owner?: string | null
          members_count?: number
          photo_url?: string | null
        }
        Update: {
          name?: string
          description?: string
          category?: string
          owner?: string | null
          members_count?: number
          photo_url?: string | null
        }
      }
      calls: {
        Row: {
          id: string
          caller: string
          callee: string
          type: 'audio' | 'video'
          status: 'ringing' | 'accepted' | 'ended' | 'missed'
          sdp_offer: string | null
          sdp_answer: string | null
          ice_candidates: any
          created_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          caller: string
          callee: string
          type: 'audio' | 'video'
          status?: 'ringing' | 'accepted' | 'ended' | 'missed'
          sdp_offer?: string | null
          sdp_answer?: string | null
          ice_candidates?: any
          created_at?: string
          ended_at?: string | null
        }
        Update: {
          status?: 'ringing' | 'accepted' | 'ended' | 'missed'
          sdp_offer?: string | null
          sdp_answer?: string | null
          ice_candidates?: any
          ended_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: number
          profile_id: string
          type: string
          payload: any
          read: boolean
          created_at: string
        }
        Insert: {
          profile_id: string
          type: string
          payload?: any
          read?: boolean
          created_at?: string
        }
        Update: {
          read?: boolean
        }
      }
      settings: {
        Row: {
          profile_id: string
          voice_enabled: boolean
          locale: string
          notifications_enabled: boolean
          tts_speed: number
          tts_volume: number
          updated_at: string
        }
        Insert: {
          profile_id: string
          voice_enabled?: boolean
          locale?: string
          notifications_enabled?: boolean
          tts_speed?: number
          tts_volume?: number
          updated_at?: string
        }
        Update: {
          voice_enabled?: boolean
          locale?: string
          notifications_enabled?: boolean
          tts_speed?: number
          tts_volume?: number
          updated_at?: string
        }
      }
      friendships: {
        Row: {
          id: number
          requester_id: string
          addressee_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
        }
        Insert: {
          requester_id: string
          addressee_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'rejected'
        }
      }
      messages: {
        Row: {
          id: number
          from_profile_id: string
          to_profile_id: string
          content: string
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: number
          from_profile_id: string
          to_profile_id: string
          content: string
          created_at?: string
          read_at?: string | null
        }
        Update: {
          content?: string
          read_at?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          participant1_id: string
          participant2_id: string
          last_message_id: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          participant1_id: string
          participant2_id: string
          last_message_id?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          last_message_id?: string | null
          updated_at?: string
        }
      }
      moderation_actions: {
        Row: {
          id: string
          action_type: string
          reason: string
          created_at: string
          moderator_id: string
          target_id?: string | null
          target_type?: string | null
        }
        Insert: {
          id?: string
          action_type: string
          reason?: string
          moderator_id: string
          target_id?: string | null
          target_type?: string | null
          created_at?: string
        }
        Update: {
          action_type?: string
          reason?: string
          moderator_id?: string
          target_id?: string | null
          target_type?: string | null
        }
      }
      post_reports: {
        Row: {
          id: string
          post_id: number
          reporter_id: string
          category: string
          description?: string | null
          status: 'pending' | 'reviewed' | 'dismissed'
          created_at: string
          reviewed_at?: string | null
          reviewer_id?: string | null
        }
        Insert: {
          id?: string
          post_id: number
          reporter_id: string
          category: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'dismissed'
          created_at?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
        }
        Update: {
          category?: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'dismissed'
          reviewed_at?: string | null
          reviewer_id?: string | null
        }
      }
      banned_users: {
        Row: {
          id: string
          user_id: string
          ban_reason: string
          banned_at: string
          banned_by: string
          expires_at?: string | null
          is_permanent: boolean
        }
        Insert: {
          id?: string
          user_id: string
          ban_reason: string
          banned_by: string
          banned_at?: string
          expires_at?: string | null
          is_permanent?: boolean
        }
        Update: {
          ban_reason?: string
          expires_at?: string | null
          is_permanent?: boolean
        }
      }
      community_posts: {
        Row: {
          id: number
          community_id: number
          author_id: string
          content: string
          likes_count: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          community_id: number
          author_id: string
          content: string
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          likes_count?: number
          comments_count?: number
          updated_at?: string
        }
      }
      community_members: {
        Row: {
          id: number
          community_id: number
          profile_id: string
          joined_at: string
          role: 'member' | 'moderator' | 'admin'
        }
        Insert: {
          community_id: number
          profile_id: string
          joined_at?: string
          role?: 'member' | 'moderator' | 'admin'
        }
        Update: {
          role?: 'member' | 'moderator' | 'admin'
        }
      }
    }
  }
}
