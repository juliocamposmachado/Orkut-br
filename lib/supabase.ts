import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Configurar Supabase apenas se as variáveis estiverem disponíveis
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Cliente mock para quando Supabase não está configurado
const createMockClient = (): SupabaseClient => {
  const mockFunction = () => Promise.resolve({ data: null, error: new Error('Supabase não configurado') })
  
  return {
    from: () => ({
      select: () => mockFunction(),
      insert: () => mockFunction(),
      update: () => mockFunction(),
      delete: () => mockFunction(),
      upsert: () => mockFunction(),
      eq: () => ({ select: () => mockFunction() }),
      single: () => mockFunction(),
      or: () => ({ select: () => mockFunction() }),
      neq: () => ({ select: () => mockFunction() }),
      limit: () => ({ select: () => mockFunction() }),
      order: () => ({ select: () => mockFunction() }),
      ilike: () => ({ select: () => mockFunction() })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => mockFunction(),
      signUp: () => mockFunction(),
      signOut: () => mockFunction(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    storage: {
      from: () => ({
        upload: () => mockFunction(),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
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

// Só criar cliente se as variáveis estiverem configuradas corretamente
const createSupabaseClient = (): SupabaseClient => {
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
          created_at?: string
        }
        Update: {
          name?: string
          description?: string
          category?: string
          owner?: string | null
          members_count?: number
          photo_url?: string | null
          created_at?: string
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
    }
  }
}