import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se as variáveis estão configuradas
if (!supabaseUrl || !supabaseServiceKey || 
    supabaseUrl.includes('placeholder') || 
    supabaseUrl.includes('your_') ||
    !supabaseUrl.startsWith('https://')) {
  console.warn('Supabase não configurado para community members API')
}

// Criar cliente apenas se configurado corretamente
const supabase = (supabaseUrl && supabaseServiceKey &&
                 !supabaseUrl.includes('placeholder') &&
                 !supabaseUrl.includes('your_') &&
                 supabaseUrl.startsWith('https://'))
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

/**
 * GET /api/communities/[id]/members - Buscar membros de uma comunidade
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

    // Se Supabase não estiver configurado, retornar dados demo
    if (!supabase) {
      console.warn('Supabase não configurado - retornando dados demo para membros da comunidade')
      
      const demoMembers = [
        {
          id: 'demo-user-1',
          username: 'usuario_demo',
          display_name: 'Usuário Demo',
          photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          role: 'admin',
          joined_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]
      
      return NextResponse.json({
        success: true,
        members: demoMembers,
        total: demoMembers.length,
        demo: true,
        timestamp: new Date().toISOString()
      })
    }

    // Verificar se a comunidade existe
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, name')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      return NextResponse.json(
        { error: 'Comunidade não encontrada' },
        { status: 404 }
      )
    }

    // Buscar membros da comunidade
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select(`
        role,
        joined_at,
        profiles:profile_id(id, username, display_name, photo_url)
      `)
      .eq('community_id', communityId)
      .order('joined_at', { ascending: true })

    if (membersError) {
      console.error('Erro ao buscar membros da comunidade:', membersError)
      return NextResponse.json(
        { error: 'Erro ao buscar membros da comunidade', details: membersError.message },
        { status: 500 }
      )
    }

    // Transformar dados
    const transformedMembers = members?.map(member => ({
      ...(member.profiles as any),
      role: member.role,
      joined_at: member.joined_at
    })) || []

    return NextResponse.json({
      success: true,
      members: transformedMembers,
      total: transformedMembers.length,
      community: {
        id: community.id,
        name: community.name
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API de membros da comunidade:', error)
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
 * POST /api/communities/[id]/members - Entrar na comunidade
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

    // Se Supabase não estiver configurado, retornar erro informativo
    if (!supabase) {
      return NextResponse.json({ 
        success: false,
        error: 'Funcionalidade de adesão não disponível no momento',
        message: 'O servidor não está configurado para gerenciar membros. Entre em contato com o administrador.',
        demo: true 
      }, { status: 503 })
    }

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ 
        error: 'Autenticação necessária para entrar na comunidade' 
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

    // Verificar se a comunidade existe
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, name, members_count')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      return NextResponse.json(
        { error: 'Comunidade não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o usuário já é membro
    const { data: existingMembership } = await supabase
      .from('community_members')
      .select('id, role')
      .eq('community_id', communityId)
      .eq('profile_id', user.id)
      .single()

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Você já é membro desta comunidade' },
        { status: 409 }
      )
    }

    // Adicionar usuário como membro
    const { data: newMembership, error: joinError } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        profile_id: user.id,
        role: 'member',
        joined_at: new Date().toISOString()
      })
      .select()
      .single()

    if (joinError) {
      console.error('Erro ao entrar na comunidade:', joinError)
      return NextResponse.json(
        { error: 'Erro ao entrar na comunidade', details: joinError.message },
        { status: 500 }
      )
    }

    // Atualizar contador de membros da comunidade
    await supabase
      .from('communities')
      .update({ members_count: community.members_count + 1 })
      .eq('id', communityId)

    return NextResponse.json({
      success: true,
      membership: newMembership,
      message: `Você entrou na comunidade ${community.name}!`,
      community: {
        id: community.id,
        name: community.name,
        members_count: community.members_count + 1
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na adesão à comunidade:', error)
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
 * DELETE /api/communities/[id]/members - Sair da comunidade
 */
export async function DELETE(
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

    // Se Supabase não estiver configurado, retornar erro informativo
    if (!supabase) {
      return NextResponse.json({ 
        success: false,
        error: 'Funcionalidade de saída não disponível no momento',
        message: 'O servidor não está configurado para gerenciar membros. Entre em contato com o administrador.',
        demo: true 
      }, { status: 503 })
    }

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ 
        error: 'Autenticação necessária para sair da comunidade' 
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

    // Verificar se a comunidade existe
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, name, members_count, owner')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      return NextResponse.json(
        { error: 'Comunidade não encontrada' },
        { status: 404 }
      )
    }

    // Não permitir que o owner saia da comunidade
    if (community.owner === user.id) {
      return NextResponse.json(
        { error: 'O criador da comunidade não pode sair. Transfira a propriedade primeiro.' },
        { status: 403 }
      )
    }

    // Verificar se o usuário é membro
    const { data: membership, error: membershipError } = await supabase
      .from('community_members')
      .select('id, role')
      .eq('community_id', communityId)
      .eq('profile_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Você não é membro desta comunidade' },
        { status: 404 }
      )
    }

    // Remover usuário da comunidade
    const { error: leaveError } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('profile_id', user.id)

    if (leaveError) {
      console.error('Erro ao sair da comunidade:', leaveError)
      return NextResponse.json(
        { error: 'Erro ao sair da comunidade', details: leaveError.message },
        { status: 500 }
      )
    }

    // Atualizar contador de membros da comunidade
    await supabase
      .from('communities')
      .update({ members_count: Math.max(0, community.members_count - 1) })
      .eq('id', communityId)

    return NextResponse.json({
      success: true,
      message: `Você saiu da comunidade ${community.name}`,
      community: {
        id: community.id,
        name: community.name,
        members_count: Math.max(0, community.members_count - 1)
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao sair da comunidade:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
