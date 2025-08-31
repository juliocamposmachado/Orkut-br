import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Criar cliente Supabase do servidor
    const supabaseServer = createServerSupabaseClient()
    
    // Buscar logins recentes (últimas 2 horas) da tabela auth.sessions
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    
    // Query SQL personalizada para buscar dados das tabelas auth
    const { data: loginData, error: loginError } = await supabaseServer
      .rpc('get_recent_logins', {
        since_time: twoHoursAgo
      })

    if (loginError) {
      console.warn('Erro ao buscar logins reais:', loginError)
      // Fallback: tentar buscar diretamente das tabelas auth
      const { data: sessionsData, error: sessionsError } = await supabaseServer
        .from('auth.sessions')
        .select(`
          id,
          user_id,
          created_at,
          updated_at,
          refreshed_at,
          user_agent,
          ip
        `)
        .gte('created_at', twoHoursAgo)
        .order('created_at', { ascending: false })
        .limit(20)

      if (sessionsError) {
        throw new Error('Não foi possível acessar dados de sessão')
      }

      // Buscar dados dos usuários correspondentes
      const userIds = sessionsData?.map(session => session.user_id) || []
      const { data: usersData, error: usersError } = await supabaseServer
        .from('auth.users')
        .select(`
          id,
          email,
          created_at,
          last_sign_in_at,
          raw_user_meta_data
        `)
        .in('id', userIds)

      if (usersError) {
        throw new Error('Não foi possível acessar dados de usuários')
      }

      // Combinar dados de sessões e usuários
      const combinedData = sessionsData?.map(session => {
        const user = usersData?.find(u => u.id === session.user_id)
        const displayName = user?.raw_user_meta_data?.display_name || 
                           user?.raw_user_meta_data?.full_name || 
                           user?.email?.split('@')[0] || 
                           'Usuário'
        const username = user?.raw_user_meta_data?.username || 
                        user?.email?.split('@')[0] || 
                        'usuario'
        
        return {
          id: session.id,
          user_id: session.user_id,
          display_name: displayName,
          username: username,
          photo_url: user?.raw_user_meta_data?.photo_url || 
                    user?.raw_user_meta_data?.avatar_url || '',
          login_time: session.created_at,
          last_activity: session.refreshed_at || session.updated_at,
          user_agent: session.user_agent,
          ip: session.ip,
          status: determineUserStatus(session.refreshed_at || session.updated_at),
          is_new_user: checkIfNewUser(user?.created_at)
        }
      }) || []

      // Transformar dados para o formato esperado
      const recentLogins = combinedData

      // Contar estatísticas
      const onlineCount = recentLogins.filter((login: any) => login.status === 'online').length
      const totalCount = recentLogins.length

      return NextResponse.json({
        success: true,
        logins: recentLogins,
        stats: {
          online: onlineCount,
          total: totalCount,
          new_users: recentLogins.filter((login: any) => login.is_new_user).length
        },
        data_source: 'real_auth_tables'
      })
    }

    // Se a função RPC funcionou, processar os dados
    const recentLogins = loginData?.map((login: any) => ({
      id: login.session_id,
      user_id: login.user_id,
      display_name: login.display_name || 'Usuário',
      username: login.username || 'usuario',
      photo_url: login.photo_url || '',
      login_time: login.login_time,
      status: login.status || 'online',
      is_new_user: checkIfNewUser(login.user_created_at)
    })) || []

    // Contar estatísticas
    const onlineCount = recentLogins.filter((login: any) => login.status === 'online').length
    const totalCount = recentLogins.length

    return NextResponse.json({
      success: true,
      logins: recentLogins,
      stats: {
        online: onlineCount,
        total: totalCount,
        new_users: recentLogins.filter((login: any) => login.is_new_user).length
      },
      data_source: 'rpc_function'
    })

  } catch (error) {
    console.error('Erro ao buscar logins recentes:', error)
    
    // Retornar dados demo em caso de erro para manter a funcionalidade
    const demoLogins = [
      {
        id: '1',
        user_id: 'demo1',
        display_name: 'Carlos Silva',
        username: 'carlos_silva',
        photo_url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100',
        login_time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        status: 'online' as const
      },
      {
        id: '2',
        user_id: 'demo2',
        display_name: 'Ana Costa',
        username: 'ana_costa',
        photo_url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100',
        login_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        status: 'online' as const,
        is_new_user: true
      },
      {
        id: '3',
        user_id: 'demo3',
        display_name: 'Roberto Oliveira',
        username: 'roberto_oliveira',
        photo_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
        login_time: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        status: 'online' as const
      },
      {
        id: '4',
        user_id: 'demo4',
        display_name: 'Mariana Santos',
        username: 'mariana_santos',
        photo_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
        login_time: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
        status: 'away' as const
      }
    ]

    return NextResponse.json({
      success: true,
      logins: demoLogins,
      stats: {
        online: 3,
        total: 4,
        new_users: 1
      },
      demo: true
    })
  }
}

// Determinar status do usuário baseado na última atividade
function determineUserStatus(lastActivity: string | null): 'online' | 'away' | 'offline' {
  if (!lastActivity) return 'offline'
  
  const lastActivityTime = new Date(lastActivity)
  const now = new Date()
  const timeDiff = now.getTime() - lastActivityTime.getTime()
  const minutesDiff = timeDiff / (1000 * 60)
  
  // Online: última atividade há menos de 5 minutos
  if (minutesDiff < 5) return 'online'
  // Away: última atividade entre 5 e 30 minutos
  if (minutesDiff < 30) return 'away'
  // Offline: última atividade há mais de 30 minutos
  return 'offline'
}

// Verificar se o usuário é novo (criado nas últimas 24 horas)
function checkIfNewUser(createdAt: string | null): boolean {
  if (!createdAt) return false
  
  const created = new Date(createdAt)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  return created > twentyFourHoursAgo
}
