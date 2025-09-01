import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Interfaces para tipagem
interface ModerationAction {
  id: string
  action_type: string
  reason: string
  created_at: string
  moderator_id: string
}

interface PostReport {
  id: string
  category: string
  description?: string
  status: string
  created_at: string
}

interface CommunityAnnouncement {
  id: string
  type: 'moderation' | 'system' | 'community' | 'warning'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  icon: string
  color: string
  created_at: string
  is_active: boolean
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('Buscando avisos da comunidade com dados reais do banco...')
    
    // ESTRATEGIA 1: Buscar dados de posts recentes para atividade da comunidade
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('id, created_at, author, author_name, content, likes_count, comments_count')
      .order('created_at', { ascending: false })
      .limit(20)
      
    console.log('Dados posts:', { 
      count: postsData?.length, 
      error: postsError?.message || 'Nenhum erro',
      sample: postsData?.slice(0, 2)
    })

    // ESTRATEGIA 2: Buscar dados de perfis para estatísticas de membros
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name, created_at, fans_count')
      .order('created_at', { ascending: false })
      .limit(10)
      
    console.log('Dados profiles:', { 
      count: profilesData?.length, 
      error: profilesError?.message || 'Nenhum erro'
    })

    // ESTRATEGIA 3: Buscar comunidades para estatísticas
    const { data: communitiesData, error: communitiesError } = await supabase
      .from('communities')
      .select('id, name, members_count, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
      
    console.log('Dados communities:', { 
      count: communitiesData?.length, 
      error: communitiesError?.message || 'Nenhum erro'
    })

    // ESTRATEGIA 4: Buscar notificações para estatísticas de atividade
    const { data: notificationsData, error: notificationsError } = await supabase
      .from('notifications')
      .select('id, type, read, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
      
    console.log('Dados notifications:', { 
      count: notificationsData?.length, 
      error: notificationsError?.message || 'Nenhum erro'
    })

    // Processar dados reais em avisos da comunidade
    const announcements: CommunityAnnouncement[] = []
    let hasRealData = false

    // Processar dados de posts para atividade da comunidade
    if (postsData && postsData.length > 0 && !postsError) {
      hasRealData = true
      const today = new Date()
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      const recentPosts = postsData.filter(post => new Date(post.created_at) > yesterday)
      const weeklyPosts = postsData.filter(post => new Date(post.created_at) > weekAgo)
      
      // Aviso de atividade diária
      if (recentPosts.length > 0) {
        announcements.push({
          id: 'daily_activity',
          type: 'community',
          title: `${recentPosts.length} Nova(s) Postagem(ns) Hoje`,
          description: `Comunidade ativa! ${recentPosts.length} nova(s) postagem(ns) nas ultimas 24h`,
          priority: recentPosts.length > 5 ? 'medium' : 'low',
          icon: 'Users',
          color: 'text-green-600',
          created_at: recentPosts[0].created_at,
          is_active: true
        })
      }
      
      // Estatísticas semanais
      if (weeklyPosts.length > 0) {
        const totalLikes = weeklyPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0)
        const totalComments = weeklyPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0)
        
        announcements.push({
          id: 'weekly_stats',
          type: 'community',
          title: `Estatisticas Semanais`,
          description: `${weeklyPosts.length} posts, ${totalLikes} curtidas, ${totalComments} comentarios esta semana`,
          priority: 'low',
          icon: 'Heart',
          color: 'text-blue-600',
          created_at: weeklyPosts[0].created_at,
          is_active: true
        })
      }
    }

    // Processar dados de perfis para novos membros
    if (profilesData && profilesData.length > 0 && !profilesError) {
      hasRealData = true
      const today = new Date()
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const newProfiles = profilesData.filter(profile => new Date(profile.created_at) > lastWeek)
      
      if (newProfiles.length > 0) {
        announcements.push({
          id: 'new_members',
          type: 'community',
          title: `${newProfiles.length} Novo(s) Membro(s) esta Semana`,
          description: `Bem-vindos aos novos amigos que se juntaram a nossa comunidade fraternal!`,
          priority: 'medium',
          icon: 'UserCheck',
          color: 'text-purple-600',
          created_at: newProfiles[0].created_at,
          is_active: true
        })
      }
    }

    // Processar dados de comunidades
    if (communitiesData && communitiesData.length > 0 && !communitiesError) {
      hasRealData = true
      const totalMembers = communitiesData.reduce((sum, community) => sum + community.members_count, 0)
      
      announcements.push({
        id: 'communities_stats',
        type: 'community',
        title: `${communitiesData.length} Comunidade(s) Ativa(s)`,
        description: `Total de ${totalMembers} membros em comunidades diversas`,
        priority: 'low',
        icon: 'Users',
        color: 'text-blue-600',
        created_at: communitiesData[0].created_at,
        is_active: true
      })
    }

    // Processar notificações para atividade
    if (notificationsData && notificationsData.length > 0 && !notificationsError) {
      hasRealData = true
      const unreadCount = notificationsData.filter(n => !n.read).length
      
      if (unreadCount > 0) {
        announcements.push({
          id: 'unread_notifications',
          type: 'system',
          title: `${unreadCount} Notificacao(es) Nao Lida(s)`,
          description: `Ha ${unreadCount} notificacao(es) aguardando atencao dos membros`,
          priority: unreadCount > 10 ? 'medium' : 'low',
          icon: 'AlertCircle',
          color: 'text-orange-600',
          created_at: notificationsData[0].created_at,
          is_active: true
        })
      }
    }

    // Adicionar avisos fixos importantes (baseados nas regras atuais)
    const staticAnnouncements: CommunityAnnouncement[] = [
      {
        id: 'rosacruz_principles',
        type: 'community',
        title: 'Principios Fraternais Ativos',
        description: 'Nossa comunidade segue os ensinamentos Rosacruzes de fraternidade e evolucao espiritual',
        priority: 'medium',
        icon: 'Heart',
        color: 'text-purple-600',
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: 'zero_tolerance',
        type: 'warning',
        title: 'Tolerancia Zero - Protecao de Menores',
        description: 'PL 2628/2022 e ECA rigorosamente aplicados. Monitoramento ativo.',
        priority: 'high',
        icon: 'Shield',
        color: 'text-red-600',
        created_at: new Date().toISOString(),
        is_active: true
      }
    ]

    // Combinar avisos reais com estáticos
    const allAnnouncements = [...announcements, ...staticAnnouncements]
      .sort((a, b) => {
        // Priorizar por importância e depois por data
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      .slice(0, 8) // Limitar a 8 avisos

    const stats = {
      total: allAnnouncements.length,
      high_priority: allAnnouncements.filter(a => a.priority === 'high').length,
      moderation_actions: announcements.filter(a => a.type === 'moderation').length,
      pending_reports: 0, // Será atualizado quando as tabelas de moderação existirem
      posts_count: postsData?.length || 0,
      profiles_count: profilesData?.length || 0,
      communities_count: communitiesData?.length || 0,
      notifications_count: notificationsData?.length || 0,
      has_real_data: hasRealData
    }

    console.log('Avisos processados:', stats)

    return NextResponse.json({
      success: true,
      announcements: allAnnouncements,
      stats,
      data_source: hasRealData ? 'real_database_with_stats' : 'static_announcements_only'
    })

  } catch (error) {
    console.error('Erro ao buscar avisos da comunidade:', error)
    
    // Fallback para avisos estáticos em caso de erro
    const fallbackAnnouncements: CommunityAnnouncement[] = [
      {
        id: 'fallback_1',
        type: 'community',
        title: 'Bem-vindos a Comunidade Fraternal',
        description: 'Espaco de evolucao humana e comunicacao etica',
        priority: 'medium',
        icon: 'Heart',
        color: 'text-purple-600',
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: 'fallback_2',
        type: 'warning',
        title: 'Diretrizes de Convivencia',
        description: 'Respeito mutuo e comunicacao fraterna sempre',
        priority: 'medium',
        icon: 'Users',
        color: 'text-green-600',
        created_at: new Date().toISOString(),
        is_active: true
      }
    ]

    return NextResponse.json({
      success: true,
      announcements: fallbackAnnouncements,
      stats: {
        total: 2,
        high_priority: 0,
        moderation_actions: 0,
        pending_reports: 0
      },
      data_source: 'fallback_static',
      error: 'Database error, using fallback data'
    })
  }
}

// Funções auxiliares para mapear tipos de moderação
function getModerationTitle(actionType: string): string {
  switch (actionType) {
    case 'hide_post': return 'Post Ocultado'
    case 'show_post': return 'Post Reexibido'
    case 'ban_user': return 'Usuario Banido'
    case 'unban_user': return 'Usuario Desbloqueado'
    case 'ban_email': return 'Email Banido'
    case 'auto_hide_post': return 'Post Auto-ocultado'
    case 'dismiss_report': return 'Relatorio Dispensado'
    case 'add_moderator': return 'Moderador Adicionado'
    case 'remove_moderator': return 'Moderador Removido'
    default: return 'Acao de Moderacao'
  }
}

function getModerationPriority(actionType: string): 'high' | 'medium' | 'low' {
  switch (actionType) {
    case 'ban_user':
    case 'ban_email':
    case 'hide_post':
      return 'high'
    case 'add_moderator':
    case 'remove_moderator':
    case 'auto_hide_post':
      return 'medium'
    default:
      return 'low'
  }
}

function getModerationIcon(actionType: string): string {
  switch (actionType) {
    case 'hide_post':
    case 'auto_hide_post':
      return 'EyeOff'
    case 'show_post':
      return 'Eye'
    case 'ban_user':
    case 'ban_email':
      return 'UserX'
    case 'unban_user':
      return 'UserCheck'
    case 'add_moderator':
      return 'Shield'
    case 'remove_moderator':
      return 'ShieldOff'
    default:
      return 'AlertCircle'
  }
}

function getModerationColor(actionType: string): string {
  switch (actionType) {
    case 'ban_user':
    case 'ban_email':
    case 'hide_post':
      return 'text-red-600'
    case 'show_post':
    case 'unban_user':
      return 'text-green-600'
    case 'add_moderator':
      return 'text-blue-600'
    case 'remove_moderator':
      return 'text-orange-600'
    default:
      return 'text-gray-600'
  }
}
