import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Interfaces para tipagem
interface UserPresence {
  id: string
  user_id: string
  is_online: boolean
  last_seen: string
  status: string
  device_info?: any
  created_at: string
  updated_at: string
}

interface Profile {
  id: string
  username: string
  display_name: string
  photo_url: string
  created_at: string
  email?: string
}

interface ProcessedLogin {
  id: string
  user_id: string
  display_name: string
  username: string
  photo_url: string
  login_time: string
  last_activity?: string
  user_agent?: string
  ip?: string
  status: 'online' | 'away' | 'offline'
  is_new_user: boolean
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔍 Buscando logins recentes com dados reais do banco...')
    
    // ESTRATÉGIA 1: Buscar user_presence primeiro, depois profiles separadamente
    const { data: presenceData, error: presenceError } = await supabase
      .from('user_presence')
      .select('user_id, is_online, last_seen, status, updated_at')
      .order('last_seen', { ascending: false })
      .limit(25)
      
    console.log('📊 Dados user_presence:', { 
      count: presenceData?.length, 
      error: presenceError 
    })

    if (!presenceError && presenceData && presenceData.length > 0) {
      // Buscar profiles para os user_ids encontrados
      const userIds = presenceData.map(p => p.user_id)
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, photo_url, created_at')
        .in('id', userIds)
        
      console.log('📊 Dados profiles para presence:', { 
        count: profilesData?.length, 
        error: profilesError 
      })
      
      if (!profilesError && profilesData) {
        // Combinar dados de presence com profiles
        const combinedData = presenceData.map(presence => {
          const profile = profilesData.find(p => p.id === presence.user_id)
          return {
            ...presence,
            profiles: profile
          }
        }).filter(item => item.profiles) // Filtrar apenas os que têm profile
        
        var activeUsersData: any = combinedData
        var activeUsersError: any = null
      } else {
        var activeUsersData: any = null
        var activeUsersError: any = profilesError
      }
    } else {
      var activeUsersData: any = null
      var activeUsersError: any = presenceError
    }
      
    console.log('📊 Dados user_presence + profiles:', { 
      count: activeUsersData?.length, 
      error: activeUsersError 
    })

    if (!activeUsersError && activeUsersData && activeUsersData.length > 0) {
      // Processar dados reais com status de presença
      const recentLogins: ProcessedLogin[] = activeUsersData.map((userPresence: any) => {
        const profile = userPresence.profiles
        const lastSeen = userPresence.last_seen || userPresence.updated_at
        
        return {
          id: `presence_${userPresence.user_id}`,
          user_id: userPresence.user_id,
          display_name: profile.display_name || 'Usuário',
          username: profile.username || 'usuario',
          photo_url: profile.photo_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
          login_time: lastSeen,
          last_activity: lastSeen,
          status: determineUserStatusFromPresence(userPresence),
          is_new_user: checkIfNewUser(profile.created_at)
        } as ProcessedLogin
      })

      const stats = {
        online: recentLogins.filter(login => login.status === 'online').length,
        total: recentLogins.length,
        new_users: recentLogins.filter(login => login.is_new_user).length
      }

      console.log('✅ Dados reais processados:', stats)

      return NextResponse.json({
        success: true,
        logins: recentLogins,
        stats,
        data_source: 'user_presence_with_profiles'
      })
    }

    // ESTRATÉGIA 2: Fallback para apenas profiles (usuários recentemente atualizados)
    console.log('⚠️ Fallback: buscando apenas da tabela profiles...')
    
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        photo_url,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(15)
      
    if (!profilesError && profilesData && profilesData.length > 0) {
      const recentLogins: ProcessedLogin[] = profilesData.map((profile: any) => ({
        id: `profile_${profile.id}`,
        user_id: profile.id,
        display_name: profile.display_name || 'Usuário',
        username: profile.username || 'usuario',
        photo_url: profile.photo_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
        login_time: profile.created_at,
        last_activity: profile.created_at,
        status: 'offline' as const, // Assumir offline já que não temos dados de presença
        is_new_user: checkIfNewUser(profile.created_at)
      }))

      const stats = {
        online: 0, // Sem dados de presença, assumir que ninguém está online
        total: recentLogins.length,
        new_users: recentLogins.filter(login => login.is_new_user).length
      }

      return NextResponse.json({
        success: true,
        logins: recentLogins,
        stats,
        data_source: 'profiles_only'
      })
    }

    // ESTRATÉGIA 3: Sem dados reais - retornar lista vazia
    console.warn('⚠️ Nenhum dado real encontrado')
    return NextResponse.json({
      success: true,
      logins: [],
      stats: {
        online: 0,
        total: 0,
        new_users: 0
      },
      data_source: 'no_real_data'
    })

  } catch (error) {
    console.error('Erro ao buscar logins recentes:', error)
    
    // Retornar dados demo em caso de erro para manter a funcionalidade
    const demoLogins: ProcessedLogin[] = [
      {
        id: '1',
        user_id: 'demo1',
        display_name: 'Carlos Silva',
        username: 'carlos_silva',
        photo_url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100',
        login_time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        status: 'online' as const,
        is_new_user: false
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
        status: 'online' as const,
        is_new_user: false
      },
      {
        id: '4',
        user_id: 'demo4',
        display_name: 'Mariana Santos',
        username: 'mariana_santos',
        photo_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
        login_time: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
        status: 'away' as const,
        is_new_user: false
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

// Determinar status do usuário baseado nos dados da tabela user_presence
function determineUserStatusFromPresence(userPresence: any): 'online' | 'away' | 'offline' {
  // Se explicitamente marcado como online na tabela
  if (userPresence.is_online) return 'online'
  
  // Usar o status da tabela se disponível
  if (userPresence.status) {
    switch (userPresence.status.toLowerCase()) {
      case 'online': return 'online'
      case 'away': return 'away'
      case 'offline': return 'offline'
      default: break
    }
  }
  
  // Fallback: calcular baseado em last_seen
  return determineUserStatus(userPresence.last_seen)
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
