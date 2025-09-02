import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { postId, category, reason } = await req.json()

    if (!postId || !category) {
      return NextResponse.json(
        { error: 'Post ID e categoria são obrigatórios' },
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

    // Verificar se o usuário já denunciou este post
    const { data: existingReport } = await supabase
      .from('post_reports')
      .select('id')
      .eq('post_id', postId)
      .eq('reporter_id', user.id)
      .single()

    if (existingReport) {
      return NextResponse.json(
        { error: 'Você já denunciou esta postagem' },
        { status: 400 }
      )
    }

    // Verificar se o post existe
    const { data: post } = await supabase
      .from('posts')
      .select('id, author')
      .eq('id', postId)
      .single()

    if (!post) {
      return NextResponse.json(
        { error: 'Postagem não encontrada' },
        { status: 404 }
      )
    }

    // Não permitir que o usuário denuncie seu próprio post
    if (post.author === user.id) {
      return NextResponse.json(
        { error: 'Você não pode denunciar sua própria postagem' },
        { status: 400 }
      )
    }

    // Criar a denúncia
    const { data: report, error: reportError } = await supabase
      .from('post_reports')
      .insert({
        post_id: postId,
        reporter_id: user.id,
        report_category: category,
        report_reason: reason || null
      })
      .select()
      .single()

    if (reportError) {
      console.error('Erro ao criar denúncia:', reportError)
      return NextResponse.json(
        { error: 'Erro ao processar denúncia' },
        { status: 500 }
      )
    }

    // Contar total de denúncias para este post
    const { data: reportCount } = await supabase
      .rpc('count_post_reports', { post_id_param: postId })

    // Buscar informações do denunciante para logs
    const { data: reporter } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single()

    console.log(`📢 Nova denúncia registrada:`, {
      postId,
      reporterId: user.id,
      reporterName: reporter?.display_name || 'Usuário',
      category,
      totalReports: reportCount,
      autoHidden: reportCount >= 4
    })

    return NextResponse.json({
      success: true,
      message: 'Denúncia registrada com sucesso',
      reportCount,
      autoHidden: reportCount >= 4
    })

  } catch (error) {
    console.error('Erro na API de denúncia:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// API para listar denúncias (apenas para admins)
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

    if (!profile || (!['admin', 'moderator'].includes(profile.role))) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const url = new URL(req.url)
    const postId = url.searchParams.get('postId')

    let query = supabase
      .from('post_reports')
      .select(`
        *,
        reporter:profiles!reporter_id (
          display_name,
          username,
          photo_url
        ),
        post:posts (
          content,
          created_at,
          author:profiles!author (
            display_name,
            username,
            photo_url
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (postId) {
      query = query.eq('post_id', postId)
    }

    const { data: reports, error } = await query

    if (error) {
      console.error('Erro ao buscar denúncias:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar denúncias' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reports })

  } catch (error) {
    console.error('Erro na API de denúncias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
