import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { userId, reason } = await req.json()

    if (!userId || !reason) {
      return NextResponse.json(
        { error: 'ID do usuário e motivo são obrigatórios' },
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

    // Verificar se o usuário é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem deletar usuários.' },
        { status: 403 }
      )
    }

    // Buscar informações do usuário a ser deletado
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id, username, display_name, email')
      .eq('id', userId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Não permitir que admin delete a si mesmo
    if (targetUser.id === user.id) {
      return NextResponse.json(
        { error: 'Você não pode deletar sua própria conta' },
        { status: 400 }
      )
    }

    console.log(`🗑️ Iniciando exclusão do usuário: ${targetUser.display_name} (${targetUser.id})`)

    // 1. Deletar posts do usuário
    const { error: postsError } = await supabase
      .from('posts')
      .delete()
      .eq('author', targetUser.id)

    if (postsError) {
      console.error('Erro ao deletar posts:', postsError)
    } else {
      console.log('✅ Posts deletados')
    }

    // 2. Deletar amizades
    const { error: friendshipsError } = await supabase
      .from('friendships')
      .delete()
      .or(`requester_id.eq.${targetUser.id},addressee_id.eq.${targetUser.id}`)

    if (friendshipsError) {
      console.error('Erro ao deletar amizades:', friendshipsError)
    } else {
      console.log('✅ Amizades deletadas')
    }

    // 3. Deletar notificações
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .eq('profile_id', targetUser.id)

    if (notificationsError) {
      console.error('Erro ao deletar notificações:', notificationsError)
    } else {
      console.log('✅ Notificações deletadas')
    }

    // 4. Deletar relatórios feitos pelo usuário
    const { error: reportsError } = await supabase
      .from('post_reports')
      .delete()
      .eq('user_id', targetUser.id)

    if (reportsError) {
      console.error('Erro ao deletar relatórios:', reportsError)
    } else {
      console.log('✅ Relatórios deletados')
    }

    // 5. Remover da tabela de usuários banidos se estiver lá
    const { error: bannedError } = await supabase
      .from('banned_users')
      .delete()
      .eq('user_id', targetUser.id)

    if (bannedError) {
      console.error('Erro ao remover de usuários banidos:', bannedError)
    } else {
      console.log('✅ Removido da lista de banidos')
    }

    // 6. Deletar o perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', targetUser.id)

    if (profileError) {
      console.error('Erro ao deletar perfil:', profileError)
      return NextResponse.json(
        { error: 'Erro ao deletar perfil do usuário' },
        { status: 500 }
      )
    }

    console.log('✅ Perfil deletado')

    // 7. Tentar deletar do Auth (se possível)
    try {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(targetUser.id)
      if (authDeleteError) {
        console.warn('Aviso: Não foi possível deletar do Auth:', authDeleteError.message)
      } else {
        console.log('✅ Usuário removido do Auth')
      }
    } catch (authError) {
      console.warn('Aviso: Erro ao tentar deletar do Auth:', authError)
    }

    // Registrar ação de moderação
    const { error: actionError } = await supabase
      .from('moderation_actions')
      .insert({
        target_user_id: targetUser.id,
        moderator_id: user.id,
        action_type: 'delete_user',
        reason: reason,
        details: {
          deleted_user: {
            id: targetUser.id,
            username: targetUser.username,
            display_name: targetUser.display_name,
            email: targetUser.email
          },
          deletion_timestamp: new Date().toISOString()
        }
      })

    if (actionError) {
      console.error('Erro ao registrar ação de moderação:', actionError)
    }

    console.log(`✅ Usuário ${targetUser.display_name} deletado com sucesso`)

    return NextResponse.json({
      success: true,
      message: `Usuário ${targetUser.display_name} foi deletado completamente do sistema`,
      deletedUser: {
        id: targetUser.id,
        username: targetUser.username,
        display_name: targetUser.display_name
      }
    })

  } catch (error) {
    console.error('Erro na API de deletar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
