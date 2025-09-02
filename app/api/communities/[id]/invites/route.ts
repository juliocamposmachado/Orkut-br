import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = (supabaseUrl && supabaseServiceKey &&
                 !supabaseUrl.includes('placeholder') &&
                 !supabaseUrl.includes('your_') &&
                 supabaseUrl.startsWith('https://'))
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

/**
 * POST /api/communities/[id]/invites - Enviar convite para comunidade
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
        error: 'Funcionalidade de convites não disponível',
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
    const { targetUserId, targetEmail, message } = body

    // Verificar se tem pelo menos um alvo
    if (!targetUserId && !targetEmail) {
      return NextResponse.json({
        error: 'É necessário informar um usuário ou email para convidar'
      }, { status: 400 })
    }

    // Verificar se o usuário pode enviar convites
    const { data: userMembership } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('profile_id', user.id)
      .single()

    const { data: community } = await supabase
      .from('communities')
      .select('owner, name, visibility')
      .eq('id', communityId)
      .single()

    if (!community) {
      return NextResponse.json({
        error: 'Comunidade não encontrada'
      }, { status: 404 })
    }

    const isOwner = community.owner === user.id
    const isAdmin = userMembership?.role === 'admin'
    const isModerator = userMembership?.role === 'moderator'

    // Verificar configurações de convite da comunidade
    const { data: settings } = await supabase
      .from('community_settings')
      .select('allow_member_invites')
      .eq('community_id', communityId)
      .single()

    const canInvite = isOwner || isAdmin || isModerator || 
                     (userMembership && settings?.allow_member_invites)

    if (!canInvite) {
      return NextResponse.json({
        error: 'Você não tem permissão para enviar convites nesta comunidade'
      }, { status: 403 })
    }

    // Gerar código único para o convite
    const invitationCode = randomBytes(16).toString('hex')

    // Verificar se o usuário alvo já é membro (se targetUserId fornecido)
    if (targetUserId) {
      const { data: existingMember } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('profile_id', targetUserId)
        .single()

      if (existingMember) {
        return NextResponse.json({
          error: 'Este usuário já é membro da comunidade'
        }, { status: 409 })
      }
    }

    // Criar convite
    const inviteData = {
      community_id: communityId,
      inviter_id: user.id,
      invited_user_id: targetUserId || null,
      invited_email: targetEmail || null,
      invitation_code: invitationCode,
      message: message || '',
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
    }

    const { data: newInvite, error: createError } = await supabase
      .from('community_invitations')
      .insert(inviteData)
      .select(`
        *,
        inviter:inviter_id(display_name, username),
        invited_user:invited_user_id(display_name, username, email)
      `)
      .single()

    if (createError) {
      console.error('Erro ao criar convite:', createError)
      return NextResponse.json({
        error: 'Erro ao criar convite',
        details: createError.message
      }, { status: 500 })
    }

    // Registrar ação de moderação
    await supabase
      .from('community_moderation_actions')
      .insert({
        community_id: communityId,
        moderator_id: user.id,
        target_user_id: targetUserId,
        action_type: 'invitation_sent',
        reason: `Convite enviado${targetEmail ? ` para ${targetEmail}` : ''}`,
        details: { invitation_code: invitationCode, message }
      })

    // Criar notificação para o usuário convidado (se existir)
    if (targetUserId) {
      await supabase
        .from('notifications')
        .insert({
          profile_id: targetUserId,
          type: 'community_invitation',
          payload: {
            community_id: communityId,
            community_name: community.name,
            inviter_name: user.user_metadata?.display_name || user.email,
            invitation_code: invitationCode,
            message
          }
        })
    }

    return NextResponse.json({
      success: true,
      invite: newInvite,
      invitation_link: `${process.env.NEXT_PUBLIC_APP_URL}/comunidades/convite/${invitationCode}`,
      message: 'Convite enviado com sucesso!',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao enviar convite:', error)
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
 * GET /api/communities/[id]/invites - Listar convites da comunidade
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
        error: 'Dados de convites não disponíveis',
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

    // Verificar se tem permissão para ver convites
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
        error: 'Você não tem permissão para ver convites desta comunidade' 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Buscar convites
    let query = supabase
      .from('community_invitations')
      .select(`
        *,
        inviter:inviter_id(display_name, username, photo_url),
        invited_user:invited_user_id(display_name, username, email)
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: invites, error: invitesError } = await query

    if (invitesError) {
      console.error('Erro ao buscar convites:', invitesError)
      return NextResponse.json({
        error: 'Erro ao buscar convites',
        details: invitesError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      invites: invites || [],
      total: invites?.length || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API de convites (GET):', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
