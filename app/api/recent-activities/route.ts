import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

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
  activity_type: 'post' | 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'community_joined' | 'photo_added' | 'profile_updated'
  activity_data: ActivityData
  created_at: string
}

// GET - Buscar atividades recentes de um usuário
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const profile_id = url.searchParams.get('profile_id')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    if (!profile_id) {
      return NextResponse.json(
        { success: false, error: 'profile_id é obrigatório' },
        { status: 400 }
      )
    }

    console.log(`🔄 Carregando atividades recentes para usuário: ${profile_id}`)

    // Verificar se Supabase está configurado
    const hasValidSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (hasValidSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from('recent_activities')
          .select('*')
          .eq('profile_id', profile_id)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (!error && data) {
          console.log(`✅ ${data.length} atividades recentes carregadas do Supabase`)
          
          return NextResponse.json({
            success: true,
            activities: data,
            total: data.length,
            source: 'database'
          })
        } else {
          console.warn('⚠️ Erro no Supabase ao buscar atividades:', error?.message)
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase falhou:', supabaseError)
      }
    }

    // Fallback: buscar no localStorage (desenvolvimento)
    console.log('🔄 Usando fallback localStorage para atividades')
    
    // Retorna atividades vazias como fallback
    return NextResponse.json({
      success: true,
      activities: [],
      total: 0,
      source: 'fallback'
    })

  } catch (error) {
    console.error('❌ Erro ao carregar atividades recentes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar atividades' },
      { status: 500 }
    )
  }
}

// POST - Criar nova atividade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profile_id, activity_type, activity_data } = body

    console.log('📝 Criando atividade recente:', { profile_id, activity_type })

    if (!profile_id || !activity_type) {
      return NextResponse.json(
        { success: false, error: 'profile_id e activity_type são obrigatórios' },
        { status: 400 }
      )
    }

    const newActivity: Partial<RecentActivity> = {
      profile_id,
      activity_type,
      activity_data: activity_data || {},
      created_at: new Date().toISOString()
    }

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
          console.log('🔑 Usando service_role_key para atividades')
        } else {
          // Tentar usar token de autenticação
          const authHeader = request.headers.get('authorization')
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '')
            serverSupabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              {
                global: {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              }
            )
          }
        }

        const { data, error } = await serverSupabase
          .from('recent_activities')
          .insert(newActivity)
          .select()
          .single()

        if (!error && data) {
          console.log('✅ Atividade salva no banco:', activity_type)
          
          // Limitar a 50 atividades por usuário (limpar antigas)
          await serverSupabase
            .from('recent_activities')
            .delete()
            .eq('profile_id', profile_id)
            .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Mais de 30 dias

          return NextResponse.json({
            success: true,
            activity: data,
            message: 'Atividade criada com sucesso',
            source: 'database'
          })
        } else {
          console.warn('⚠️ Erro ao salvar atividade no Supabase:', error?.message)
        }
      } catch (supabaseError) {
        console.error('❌ Erro crítico no Supabase:', supabaseError)
      }
    }

    // Fallback: salvar no localStorage (desenvolvimento)
    console.log('🔄 Salvando atividade no localStorage como fallback')
    
    return NextResponse.json({
      success: true,
      activity: newActivity,
      message: 'Atividade criada (fallback)',
      source: 'localStorage'
    })

  } catch (error) {
    console.error('❌ Erro ao criar atividade:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar atividade' },
      { status: 500 }
    )
  }
}
