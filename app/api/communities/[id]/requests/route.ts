import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = (supabaseUrl && supabaseServiceKey &&
                 !supabaseUrl.includes('placeholder') &&
                 !supabaseUrl.includes('your_') &&
                 supabaseUrl.startsWith('https://'))
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

/**
 * POST /api/communities/[id]/requests - Criar solicitação de entrada ou aprovar/rejeitar
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = parseInt(params.id)
    
    if (isNaN(communityId)) {
      return NextResponse.json(
        { error: 'ID da comunidade inválido' },
        { status: 400 }
      )
    }

    if (!supabase) {
      return NextResponse.json({ 
        success: false,
        error: 'Funcionalidade de solicitações não disponível',
        demo: true 
      }, { status: 503 })
    }

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ 
        error: 'Autenticação necessária' 
      }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Token de autenticação inválido' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { action, requestId, message, reviewMessage } = body

    if (action === 'create') {
      // Criar nova solicitação
      
      // Verificar se a comunidade existe e requer aprovação
      const { data: community } = await supabase
        .from('communities')
        .select('id, name, visibility, join_approval_required')
        .eq('id', communityId)
        .single()

      if (!community) {
        return NextResponse.json({
          error: 'Comunidade não encontrada'
        }, { status: 404 })
      }

      // Verificar se o usuário já é membro
      const { data: existingMember } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('profile_id', user.id)
        .single()

      if (existingMember) {
        return NextResponse.json({
          error: 'Você já é membro desta comunidade'
        }, { status: 409 })
      }

      // Verificar se já existe uma solicitação pendente
      const { data: existingRequest } = await supabase
        .from('community_join_requests')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()

      if (existingRequest) {
        return NextResponse.json({
          error: 'Você já tem uma solicitação pendente para esta comunidade'
        }, { status: 409 })
      }

      // Se a comunidade é pública e não requer aprovação, adicionar diretamente
      if (community.visibility === 'public' && !community.join_approval_required) {
        const { data: newMember, error: joinError } = await supabase
          .from('community_members')
          .insert({
            community_id: communityId,
            profile_id: user.id,
            role: 'member',
            joined_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString()
          })
          .select()
          .single()

        if (joinError) {
          console.error('Erro ao entrar na comunidade:', joinError)
          return NextResponse.json({
            error: 'Erro ao entrar na comunidade',
            details: joinError.message
          }, { status: 500 })
        }

        // Atualizar contador de membros
        const { data: currentCommunity } = await supabase
          .from('communities')
          .select('members_count')
          .eq('id', communityId)
          .single()
        
        if (currentCommunity) {
          await supabase
            .from('communities')
            .update({ members_count: currentCommunity.members_count + 1 })
            .eq('id', communityId)
        }

        return NextResponse.json({
          success: true,
          message: `Você entrou na comunidade ${community.name}!`,
          member: newMember,
          timestamp: new Date().toISOString()
        })
      }

      // Criar solicitação para comunidades que requerem aprovação
      const { data: newRequest, error: requestError } = await supabase
        .from('community_join_requests')
        .insert({
          community_id: communityId,
          user_id: user.id,
          message: message || '',
          status: 'pending'
        })
        .select(`
          *,
          user:user_id(display_name, username, photo_url)
        `)
        .single()

      if (requestError) {
        console.error('Erro ao criar solicitação:', requestError)
        return NextResponse.json({
          error: 'Erro ao criar solicitação',
          details: requestError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        request: newRequest,
        message: `Solicitação enviada para ${community.name}! Aguarde a aprovação dos moderadores.`,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'approve' || action === 'reject') {
      // Aprovar ou rejeitar solicitação

      // Verificar se tem permissão para processar solicitações
      const { data: userMembership } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('profile_id', user.id)
        .single()

      const { data: community } = await supabase
        .from('communities')
        .select('owner, name')
        .eq('id', communityId)
        .single()

      const isOwner = community?.owner === user.id
      const isAdmin = userMembership?.role === 'admin'
      const isModerator = userMembership?.role === 'moderator'

      if (!isOwner && !isAdmin && !isModerator) {
        return NextResponse.json({
          error: 'Você não tem permissão para processar solicitações'
        }, { status: 403 })
      }

      // Usar a função do banco para processar a solicitação
      const { data: result, error: processError } = await supabase.rpc('handle_join_request', {
        p_request_id: requestId,
        p_moderator_id: user.id,
        p_action: action,
        p_message: reviewMessage || ''
      })

      if (processError) {
        console.error('Erro ao processar solicitação:', processError)
        return NextResponse.json({
          error: 'Erro ao processar solicitação',
          details: processError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: action === 'approve' 
          ? 'Solicitação aprovada com sucesso!' 
          : 'Solicitação rejeitada.',
        action,
        requestId,
        timestamp: new Date().toISOString()
      })

    } else {
      return NextResponse.json({
        error: 'Ação não reconhecida. Use "create", "approve" ou "reject"'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Erro na API de solicitações:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/communities/[id]/requests - Listar solicitações de entrada
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = parseInt(params.id)
    
    if (isNaN(communityId)) {
      return NextResponse.json(
        { error: 'ID da comunidade inválido' },
        { status: 400 }
      )
    }

    if (!supabase) {
      return NextResponse.json({ 
        success: false,
        error: 'Dados de solicitações não disponíveis',
        demo: true 
      }, { status: 503 })
    }

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ 
        error: 'Autenticação necessária' 
      }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Token de autenticação inválido' 
      }, { status: 401 })
    }

    // Verificar permissões
    const { data: userMembership } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('profile_id', user.id)
      .single()

    const { data: community } = await supabase
      .from('communities')
      .select('owner')
      .eq('id', communityId)
      .single()

    const isOwner = community?.owner === user.id
    const isAdmin = userMembership?.role === 'admin'
    const isModerator = userMembership?.role === 'moderator'

    if (!isOwner && !isAdmin && !isModerator) {
      return NextResponse.json({ 
        error: 'Você não tem permissão para ver solicitações desta comunidade' 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    // Buscar solicitações
    const { data: requests, error: requestsError } = await supabase
      .from('community_join_requests')
      .select(`
        *,
        user:user_id(display_name, username, photo_url),
        reviewer:reviewed_by(display_name, username)
      `)
      .eq('community_id', communityId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('Erro ao buscar solicitações:', requestsError)
      return NextResponse.json({
        error: 'Erro ao buscar solicitações',
        details: requestsError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      requests: requests || [],
      total: requests?.length || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API de solicitações (GET):', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
