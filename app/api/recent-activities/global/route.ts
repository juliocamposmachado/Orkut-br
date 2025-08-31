import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface ActivityData {
  post_id?: number
  content?: string
  post_content?: string
  friend_id?: string
  friend_name?: string
  community_id?: string
  community_name?: string
  photo_url?: string
  old_value?: string
  new_value?: string
}

interface RecentActivity {
  id: string
  profile_id: string
  activity_type: 'post' | 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'community_joined' | 'photo_added' | 'profile_updated' | 'user_joined'
  activity_data: ActivityData
  created_at: string
  profile?: {
    id: string
    display_name: string
    username: string
    photo_url: string
  }
}

// GET - Buscar atividades recentes globais (de todos os usuários)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log(`🔄 Carregando atividades globais da comunidade (limit: ${limit})`)

    // Verificar se Supabase está configurado
    const hasValidSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (hasValidSupabase && supabase) {
      try {
        // Usar service_role se disponível para bypass RLS
        let serverSupabase = supabase
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        if (serviceKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          serverSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            serviceKey
          )
          console.log('🔑 Usando service_role_key para atividades globais')
        }

        const { data, error } = await serverSupabase
          .from('recent_activities')
          .select(`
            *,
            profiles:profile_id (
              id,
              display_name,
              username,
              photo_url
            )
          `)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (!error && data) {
          console.log(`✅ ${data.length} atividades globais carregadas do Supabase`)
          
          // Transformar os dados para incluir o perfil
          const transformedActivities = data.map(activity => ({
            ...activity,
            profile: activity.profiles
          }))
          
          return NextResponse.json({
            success: true,
            activities: transformedActivities,
            total: data.length,
            source: 'database'
          })
        } else {
          console.warn('⚠️ Erro no Supabase ao buscar atividades globais:', error?.message)
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase falhou:', supabaseError)
      }
    }

    // Fallback: retornar atividades demo para desenvolvimento
    console.log('🔄 Usando fallback demo para atividades globais')
    
    const demoActivities: RecentActivity[] = [
      {
        id: 'demo1',
        profile_id: 'demo1',
        activity_type: 'user_joined',
        activity_data: {},
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        profile: {
          id: 'demo1',
          display_name: 'Ana Santos',
          username: 'ana_santos',
          photo_url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100'
        }
      },
      {
        id: 'demo2',
        profile_id: 'demo2',
        activity_type: 'post',
        activity_data: {
          content: 'Que nostalgia estar de volta no Orkut! 💜'
        },
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        profile: {
          id: 'demo2',
          display_name: 'Carlos Lima',
          username: 'carlos_lima',
          photo_url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100'
        }
      },
      {
        id: 'demo3',
        profile_id: 'demo3',
        activity_type: 'community_joined',
        activity_data: {
          community_name: 'Nostalgia dos Anos 2000'
        },
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        profile: {
          id: 'demo3',
          display_name: 'Mariana Costa',
          username: 'mariana_costa',
          photo_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100'
        }
      },
      {
        id: 'demo4',
        profile_id: 'demo4',
        activity_type: 'user_joined',
        activity_data: {},
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        profile: {
          id: 'demo4',
          display_name: 'Roberto Silva',
          username: 'roberto_silva',
          photo_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100'
        }
      },
      {
        id: 'demo5',
        profile_id: 'demo5',
        activity_type: 'post',
        activity_data: {
          content: 'Este novo Orkut está incrível! Melhor que o original! 🚀'
        },
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        profile: {
          id: 'demo5',
          display_name: 'Juliana Oliveira',
          username: 'juliana_oliveira',
          photo_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100'
        }
      },
      {
        id: 'demo6',
        profile_id: 'demo6',
        activity_type: 'community_joined',
        activity_data: {
          community_name: 'Gamers Retro'
        },
        created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        profile: {
          id: 'demo6',
          display_name: 'Pedro Alves',
          username: 'pedro_alves',
          photo_url: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=100'
        }
      }
    ]
    
    return NextResponse.json({
      success: true,
      activities: demoActivities,
      total: demoActivities.length,
      source: 'demo'
    })

  } catch (error) {
    console.error('❌ Erro ao carregar atividades globais:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar atividades da comunidade' },
      { status: 500 }
    )
  }
}
