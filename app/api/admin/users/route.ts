import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se Supabase está configurado
if (!supabaseUrl || !supabaseServiceKey || 
    supabaseUrl.includes('placeholder') || 
    supabaseUrl.includes('your_') ||
    !supabaseUrl.startsWith('https://')) {
  console.warn('Supabase não configurado completamente para admin')
}

// Criar cliente apenas se configurado corretamente
const supabase = (supabaseUrl && supabaseServiceKey && 
                 !supabaseUrl.includes('placeholder') && 
                 !supabaseUrl.includes('your_') &&
                 supabaseUrl.startsWith('https://')) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

/**
 * Verificar se usuário é administrador
 */
async function verifyAdmin(authHeader: string) {
  if (!authHeader) {
    return { isAdmin: false, error: 'Token de autorização necessário' }
  }

  if (!supabase) {
    return { isAdmin: false, error: 'Supabase não configurado' }
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return { isAdmin: false, error: 'Token inválido' }
    }

    // Verificar se usuário tem role de admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    
    return { isAdmin, user, error: isAdmin ? null : 'Permissão insuficiente' }
  } catch (error) {
    return { isAdmin: false, error: 'Erro na verificação de permissões' }
  }
}

/**
 * GET /api/admin/users - Lista todos os usuários para administração
 */
export async function GET(request: NextRequest) {
  try {
    // Se Supabase não estiver configurado, retornar dados demo
    if (!supabase) {
      return NextResponse.json({
        users: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        },
        stats: {
          total: 0,
          active: 0,
          banned: 0,
          admins: 0,
          moderators: 0
        },
        filters: {
          search: '',
          status: 'all'
        },
        demo: true
      })
    }

    // Verificar autenticação e permissões
    const authResult = await verifyAdmin(request.headers.get('authorization') || '')
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'all' // all, active, banned, suspended
    
    const offset = (page - 1) * limit

    // Query principal para usuários com informações completas
    let usersQuery = supabase
      .from('profiles')
      .select(`
        *,
        user:id (
          email,
          created_at,
          email_confirmed_at,
          last_sign_in_at,
          is_anonymous
        ),
        banned_info:banned_users!banned_users_user_id_fkey (
          ban_reason,
          banned_at,
          ban_type
        ),
        _count_posts:posts(count),
        _count_friends:friendships!friendships_user_id_fkey(count)
      `)

    // Aplicar filtros de busca se fornecido
    if (search) {
      usersQuery = usersQuery.or(`
        display_name.ilike.%${search}%,
        username.ilike.%${search}%,
        email.ilike.%${search}%
      `)
    }

    // Aplicar filtro de status
    switch (status) {
      case 'banned':
        usersQuery = usersQuery.not('banned_info', 'is', null)
        break
      case 'active':
        usersQuery = usersQuery.is('banned_info', null)
        break
      // 'all' não adiciona filtros
    }

    // Aplicar paginação e ordenação
    const { data: users, error, count } = await usersQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar usuários', details: error.message },
        { status: 500 }
      )
    }

    // Buscar estatísticas gerais
    const { data: statsData } = await supabase
      .from('profiles')
      .select('role, banned_users!banned_users_user_id_fkey(id)', { count: 'exact' })

    const totalUsers = count || 0
    const bannedCount = (users || []).filter(u => u.banned_info?.length > 0).length
    const activeCount = totalUsers - bannedCount
    const adminCount = (statsData || []).filter(u => u.role === 'admin').length
    const moderatorCount = (statsData || []).filter(u => u.role === 'moderator').length

    // Formatar dados dos usuários
    const formattedUsers = (users || []).map(user => ({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      email: user.user?.email,
      photo_url: user.photo_url,
      role: user.role || 'user',
      bio: user.bio,
      location: user.location,
      created_at: user.created_at,
      last_sign_in_at: user.user?.last_sign_in_at,
      email_confirmed: !!user.user?.email_confirmed_at,
      is_anonymous: user.user?.is_anonymous || false,
      
      // Status de banimento
      is_banned: (user.banned_info?.length || 0) > 0,
      ban_info: user.banned_info?.[0] || null,
      
      // Estatísticas
      posts_count: user._count_posts?.[0]?.count || 0,
      friends_count: user._count_friends?.[0]?.count || 0
    }))

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),
        hasNext: offset + limit < totalUsers,
        hasPrev: page > 1
      },
      stats: {
        total: totalUsers,
        active: activeCount,
        banned: bannedCount,
        admins: adminCount,
        moderators: moderatorCount
      },
      filters: {
        search,
        status
      }
    })

  } catch (error) {
    console.error('Erro na API de usuários admin:', error)
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
 * POST /api/admin/users - Ações de moderação em usuários
 */
export async function POST(request: NextRequest) {
  try {
    // Se Supabase não estiver configurado, retornar erro amigável
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Funcionalidade administrativa não disponível',
        demo: true 
      }, { status: 503 })
    }

    // Verificar autenticação e permissões
    const authResult = await verifyAdmin(request.headers.get('authorization') || '')
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const body = await request.json()
    const { action, userId, reason, duration, notificationMessage } = body

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'Ação e ID do usuário são obrigatórios' }, 
        { status: 400 }
      )
    }

    let result: any = {}

    switch (action) {
      case 'ban':
        // Banir usuário
        const { error: banError } = await supabase
          .from('banned_users')
          .upsert({
            user_id: userId,
            ban_reason: reason || 'Banido pelo administrador',
            ban_type: 'permanent',
            banned_at: new Date().toISOString(),
            banned_by: authResult.user!.id
          })

        if (banError) throw banError

        // Log da ação
        await supabase.from('moderation_actions').insert({
          action_type: 'ban_user',
          target_user_id: userId,
          moderator_id: authResult.user!.id,
          reason: reason || 'Banido pelo administrador',
          details: { duration: 'permanent' }
        })

        result = { message: 'Usuário banido com sucesso' }
        break

      case 'suspend':
        // Suspender temporariamente
        const suspendUntil = duration ? 
          new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toISOString() : 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias padrão

        const { error: suspendError } = await supabase
          .from('user_suspensions')
          .upsert({
            user_id: userId,
            suspended_until: suspendUntil,
            reason: reason || 'Suspendido pelo administrador',
            suspended_by: authResult.user!.id,
            created_at: new Date().toISOString()
          })

        if (suspendError) throw suspendError

        // Log da ação
        await supabase.from('moderation_actions').insert({
          action_type: 'suspend_user',
          target_user_id: userId,
          moderator_id: authResult.user!.id,
          reason: reason || 'Suspendido pelo administrador',
          details: { suspended_until: suspendUntil, duration }
        })

        result = { message: `Usuário suspenso até ${new Date(suspendUntil).toLocaleDateString()}` }
        break

      case 'unban':
        // Remover banimento
        const { error: unbanError } = await supabase
          .from('banned_users')
          .delete()
          .eq('user_id', userId)

        if (unbanError) throw unbanError

        // Log da ação
        await supabase.from('moderation_actions').insert({
          action_type: 'unban_user',
          target_user_id: userId,
          moderator_id: authResult.user!.id,
          reason: reason || 'Banimento removido pelo administrador'
        })

        result = { message: 'Banimento removido com sucesso' }
        break

      case 'delete':
        // Deletar usuário completamente (PERIGOSO)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
        
        if (deleteError) throw deleteError

        // Log da ação
        await supabase.from('moderation_actions').insert({
          action_type: 'delete_user',
          target_user_id: userId,
          moderator_id: authResult.user!.id,
          reason: reason || 'Usuário deletado pelo administrador',
          details: { permanent: true }
        })

        result = { message: 'Usuário deletado permanentemente' }
        break

      case 'promote':
        // Promover a moderador/admin
        const newRole = body.role || 'moderator'
        
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', userId)

        if (roleError) throw roleError

        // Log da ação
        await supabase.from('moderation_actions').insert({
          action_type: 'change_role',
          target_user_id: userId,
          moderator_id: authResult.user!.id,
          reason: reason || `Promovido para ${newRole}`,
          details: { new_role: newRole }
        })

        result = { message: `Usuário promovido para ${newRole}` }
        break

      case 'notify':
        // Enviar notificação de regras
        const { error: notifyError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'moderation',
            title: 'Aviso da Moderação',
            message: notificationMessage || 'Você recebeu um aviso da moderação.',
            data: {
              from_admin: true,
              moderator_id: authResult.user!.id,
              reason: reason
            },
            created_at: new Date().toISOString()
          })

        if (notifyError) throw notifyError

        // Log da ação
        await supabase.from('moderation_actions').insert({
          action_type: 'send_warning',
          target_user_id: userId,
          moderator_id: authResult.user!.id,
          reason: reason || 'Aviso enviado',
          details: { message: notificationMessage }
        })

        result = { message: 'Notificação enviada com sucesso' }
        break

      default:
        return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 })
    }

    return NextResponse.json({ success: true, ...result })

  } catch (error) {
    console.error('Erro na ação de moderação:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
