import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { postId, action, reason } = await req.json()

    if (!postId || !action || !reason) {
      return NextResponse.json(
        { error: 'Post ID, ação e motivo são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário é admin/moderador
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem realizar ações de moderação.' },
        { status: 403 }
      )
    }

    // Buscar informações do post
    const { data: post } = await supabase
      .from('posts')
      .select('id, author')
      .eq('id', postId)
      .single()

    if (!post) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      )
    }

    // Criar ação de moderação
    const { data: moderationAction, error: actionError } = await supabase
      .from('moderation_actions')
      .insert({
        post_id: postId,
        target_user_id: post.author,
        moderator_id: user.id,
        action_type: action,
        reason: reason,
        details: {
          manual_action: true,
          moderator_name: user.email
        }
      })
      .select()
      .single()

    if (actionError) {
      console.error('Erro ao criar ação de moderação:', actionError)
      return NextResponse.json(
        { error: 'Erro ao processar ação de moderação' },
        { status: 500 }
      )
    }

    console.log(`🛡️ Ação de moderação aplicada:`, {
      postId,
      action,
      moderatorId: user.id,
      reason
    })

    return NextResponse.json({
      success: true,
      message: 'Ação de moderação aplicada com sucesso',
      action: moderationAction
    })

  } catch (error) {
    console.error('Erro na API de ações de moderação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// API para listar ações de moderação (apenas para admins)
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário é admin/moderador
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { data: actions, error } = await supabase
      .from('moderation_actions')
      .select(`
        *,
        moderator:profiles!moderator_id (
          display_name,
          username
        ),
        target_user:profiles!target_user_id (
          display_name,
          username,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Erro ao buscar ações de moderação:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar ações de moderação' },
        { status: 500 }
      )
    }

    return NextResponse.json({ actions })

  } catch (error) {
    console.error('Erro na API de ações de moderação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
