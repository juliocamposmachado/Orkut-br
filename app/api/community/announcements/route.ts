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
    console.log('Buscando avisos da comunidade com dados reais...')
    
    // ESTRATEGIA 1: Buscar ações de moderação recentes
    const { data: moderationData, error: moderationError } = await supabase
      .from('moderation_actions')
      .select('id, action_type, reason, created_at, moderator_id')
      .order('created_at', { ascending: false })
      .limit(10)
      
    console.log('Dados moderation_actions:', { 
      count: moderationData?.length, 
      error: moderationError 
    })

    // ESTRATEGIA 2: Buscar relatórios de posts pendentes
    const { data: reportsData, error: reportsError } = await supabase
      .from('post_reports')
      .select('id, category, description, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)
      
    console.log('Dados post_reports:', { 
      count: reportsData?.length, 
      error: reportsError 
    })

    // ESTRATEGIA 3: Buscar usuários banidos recentemente
    const { data: bannedData, error: bannedError } = await supabase
      .from('banned_users')
      .select('id, ban_reason, banned_at')
      .order('banned_at', { ascending: false })
      .limit(3)
      
    console.log('Dados banned_users:', { 
      count: bannedData?.length, 
      error: bannedError 
    })

    // Processar dados reais em avisos da comunidade
    const announcements: CommunityAnnouncement[] = []

    // Adicionar avisos de moderação
    if (moderationData && moderationData.length > 0) {
      moderationData.forEach((action: any) => {
        announcements.push({
          id: `mod_${action.id}`,
          type: 'moderation',
          title: getModerationTitle(action.action_type),
          description: action.reason || 'Acao de moderacao executada',
          priority: getModerationPriority(action.action_type),
          icon: getModerationIcon(action.action_type),
          color: getModerationColor(action.action_type),
          created_at: action.created_at,
          is_active: true
        })
      })
    }

    // Adicionar avisos de relatórios pendentes
    if (reportsData && reportsData.length > 0) {
      const pendingReportsCount = reportsData.length
      announcements.push({
        id: 'reports_pending',
        type: 'warning',
        title: `${pendingReportsCount} Relatorio(s) Pendente(s)`,
        description: `Ha ${pendingReportsCount} relatorio(s) de conteudo aguardando revisao`,
        priority: pendingReportsCount > 3 ? 'high' : 'medium',
        icon: 'AlertTriangle',
        color: 'text-orange-600',
        created_at: reportsData[0].created_at,
        is_active: true
      })
    }

    // Adicionar avisos de banimentos recentes
    if (bannedData && bannedData.length > 0) {
      announcements.push({
        id: 'recent_bans',
        type: 'moderation',
        title: `${bannedData.length} Usuario(s) Banido(s) Recentemente`,
        description: `Ultimas acoes de moderacao: ${bannedData.map(b => b.ban_reason).join(', ')}`,
        priority: 'high',
        icon: 'Shield',
        color: 'text-red-600',
        created_at: bannedData[0].banned_at,
        is_active: true
      })
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
      pending_reports: reportsData?.length || 0
    }

    console.log('Avisos processados:', stats)

    return NextResponse.json({
      success: true,
      announcements: allAnnouncements,
      stats,
      data_source: 'real_database_community_data'
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
