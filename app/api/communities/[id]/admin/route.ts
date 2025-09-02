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
 * POST /api/communities/[id]/admin - Ações administrativas
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
        error: 'Funcionalidade administrativa não disponível',
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
    const { action, targetUserId, newRole, reason, banDuration } = body

    // Verificar se o usuário tem permissão administrativa
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
        error: 'Você não tem permissão para executar ações administrativas' 
      }, { status: 403 })
    }

    let result
    let message

    switch (action) {
      case 'promote_member':
        // Verificar se tem permissão para promover (apenas admin/owner)
        if (!isOwner && !isAdmin) {
          return NextResponse.json({ 
            error: 'Apenas admins podem promover membros' 
          }, { status: 403 })
        }

        result = await supabase.rpc('manage_community_member_role', {
          p_community_id: communityId,
          p_target_user_id: targetUserId,
          p_new_role: newRole,
          p_moderator_id: user.id,
          p_reason: reason || 'Promoção de membro'
        })

        message = `Membro promovido para ${newRole} com sucesso!`
        break

      case 'demote_member':
        // Verificar se tem permissão para rebaixar (apenas admin/owner)
        if (!isOwner && !isAdmin) {
          return NextResponse.json({ 
            error: 'Apenas admins podem rebaixar membros' 
          }, { status: 403 })
        }

        result = await supabase.rpc('manage_community_member_role', {
          p_community_id: communityId,
          p_target_user_id: targetUserId,
          p_new_role: 'member',
          p_moderator_id: user.id,
          p_reason: reason || 'Rebaixamento de membro'
        })

        message = 'Membro rebaixado com sucesso!'
        break

      case 'remove_member':
        result = await supabase.rpc('remove_community_member', {
          p_community_id: communityId,
          p_target_user_id: targetUserId,
          p_moderator_id: user.id,
          p_reason: reason || 'Removido da comunidade',
          p_ban_user: false
        })

        message = 'Membro removido da comunidade!'
        break

      case 'ban_member':
        const banDurationInterval = banDuration ? `${banDuration} days` : null

        result = await supabase.rpc('remove_community_member', {
          p_community_id: communityId,
          p_target_user_id: targetUserId,
          p_moderator_id: user.id,
          p_reason: reason || 'Banido da comunidade',
          p_ban_user: true,
          p_ban_duration: banDurationInterval
        })

        message = banDuration 
          ? `Membro banido por ${banDuration} dias!` 
          : 'Membro banido permanentemente!'
        break

      case 'unban_member':
        // Desbanir usuário
        const { error: unbanError } = await supabase
          .from('community_banned_users')
          .update({ is_active: false })
          .eq('community_id', communityId)
          .eq('user_id', targetUserId)

        if (unbanError) throw unbanError

        // Registrar ação
        await supabase
          .from('community_moderation_actions')
          .insert({
            community_id: communityId,
            moderator_id: user.id,
            target_user_id: targetUserId,
            action_type: 'member_unbanned',
            reason: reason || 'Usuário desbanido'
          })

        message = 'Usuário desbanido com sucesso!'
        break

      default:
        return NextResponse.json({ 
          error: 'Ação não reconhecida' 
        }, { status: 400 })
    }

    if (result?.error) {
      console.error('Erro na ação administrativa:', result.error)
      return NextResponse.json({ 
        error: 'Erro ao executar ação', 
        details: result.error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message,
      action,
      targetUserId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API administrativa:', error)
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
 * GET /api/communities/[id]/admin - Obter dados administrativos
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
        error: 'Dados administrativos não disponíveis',
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
        error: 'Você não tem permissão para acessar dados administrativos' 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get('type') || 'overview'

    let responseData: any = {}

    switch (dataType) {
      case 'overview':
        // Estatísticas gerais
        const { data: stats } = await supabase
          .from('community_stats')
          .select('*')
          .eq('community_id', communityId)
          .single()

        // Solicitações pendentes
        const { data: pendingRequests } = await supabase
          .from('community_join_requests')
          .select(`
            id,
            user_id,
            message,
            created_at,
            profiles:user_id(display_name, username, photo_url)
          `)
          .eq('community_id', communityId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        // Relatórios pendentes
        const { data: pendingReports } = await supabase
          .from('community_reports')
          .select('*')
          .eq('community_id', communityId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        responseData = {
          stats: stats || {},
          pendingRequests: pendingRequests || [],
          pendingReports: pendingReports || []
        }
        break

      case 'members':
        // Lista completa de membros com detalhes administrativos
        const { data: memberDetails } = await supabase
          .from('community_member_details')
          .select('*')
          .eq('community_id', communityId)
          .order('joined_at', { ascending: true })

        responseData = { members: memberDetails || [] }
        break

      case 'moderation':
        // Histórico de ações de moderação
        const { data: moderationActions } = await supabase
          .from('community_moderation_actions')
          .select(`
            *,
            moderator:moderator_id(display_name, username),
            target_user:target_user_id(display_name, username)
          `)
          .eq('community_id', communityId)
          .order('created_at', { ascending: false })
          .limit(50)

        responseData = { moderationActions: moderationActions || [] }
        break

      case 'banned':
        // Usuários banidos
        const { data: bannedUsers } = await supabase
          .from('community_banned_users')
          .select(`
            *,
            user:user_id(display_name, username, photo_url),
            banned_by_user:banned_by(display_name, username)
          `)
          .eq('community_id', communityId)
          .eq('is_active', true)
          .order('banned_at', { ascending: false })

        responseData = { bannedUsers: bannedUsers || [] }
        break
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API administrativa (GET):', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
