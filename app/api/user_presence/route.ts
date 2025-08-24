import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    
    // Buscar usuários online (últimos 5 minutos)
    const { data, error } = await supabase
      .from('user_presence')
      .select(`
        user_id,
        is_online,
        last_seen,
        profiles!user_presence_user_id_fkey(
          display_name,
          username,
          photo_url
        )
      `)
      .eq('is_online', true)
      .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('last_seen', { ascending: false })

    if (error) {
      console.error('Erro ao buscar usuários online:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar usuários online', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Erro na API user_presence:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === 'mark_online') {
      // Marcar usuário como online usando UPSERT
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          is_online: true,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Erro ao marcar como online:', error)
        return NextResponse.json(
          { error: 'Erro ao marcar como online', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Usuário marcado como online'
      })

    } else if (action === 'mark_offline') {
      // Marcar usuário como offline usando UPSERT
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          is_online: false,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Erro ao marcar como offline:', error)
        return NextResponse.json(
          { error: 'Erro ao marcar como offline', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Usuário marcado como offline'
      })

    } else {
      return NextResponse.json(
        { error: 'Ação não suportada' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Erro na API user_presence POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Atualizar presença do usuário (heartbeat) usando UPSERT
    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: user.id,
        last_seen: new Date().toISOString(),
        is_online: true
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Erro ao atualizar presença:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar presença', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Presença atualizada'
    })

  } catch (error) {
    console.error('Erro na API user_presence PUT:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
