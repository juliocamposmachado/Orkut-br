import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
          content: string
          visibility: 'public' | 'friends'
          likes_count: number
          comments_count: number
          created_at: string
        }
        Insert: {
          author: string
          content: string
          visibility?: 'public' | 'friends'
          likes_count?: number
          comments_count?: number
          created_at?: string
        }
        Update: {
          author?: string
          content?: string
          visibility?: 'public' | 'friends'
          likes_count?: number
          comments_count?: number
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