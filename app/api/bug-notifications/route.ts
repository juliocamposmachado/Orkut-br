import { NextRequest, NextResponse } from 'next/server'

// Configuração da API do Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'

interface BugNotification {
  id: string
  type: 'bug_alert' | 'deploy_status' | 'maintenance' | 'performance_warning'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  details?: string
  timestamp: string
  status: 'active' | 'resolved' | 'investigating'
  affected_systems: string[]
  estimated_fix_time?: string
  actions_taken?: string[]
}

interface SystemStatus {
  overall_status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage'
  services: {
    [key: string]: {
      status: 'operational' | 'degraded' | 'outage'
      last_incident?: string
    }
  }
  active_notifications: BugNotification[]
  last_updated: string
}

// Simulador de banco de dados de notificações
let notificationsDB: BugNotification[] = []
let systemStatusDB: SystemStatus = {
  overall_status: 'operational',
  services: {
    'web_interface': { status: 'operational' },
    'chat_system': { status: 'operational' },
    'communities': { status: 'operational' },
    'media_upload': { status: 'operational' },
    'real_time_updates': { status: 'operational' }
  },
  active_notifications: [],
  last_updated: new Date().toISOString()
}

// Função para gerar mensagem personalizada usando IA
async function generateNotificationMessage(bugData: any): Promise<string> {
  try {
    const prompt = `
    Você é o Sistema Orkut, uma IA responsável por comunicar problemas técnicos aos usuários de forma clara e amigável.
    
    Dados do problema:
    - Tipo: ${bugData.type}
    - Severidade: ${bugData.severity}
    - Descrição técnica: ${bugData.technical_description}
    - Sistemas afetados: ${bugData.affected_systems?.join(', ') || 'Indefinido'}
    
    Crie uma mensagem para o feed do Orkut que seja:
    1. Clara e objetiva (máximo 200 caracteres)
    2. Tranquilizadora mas honesta
    3. Use emojis apropriados
    4. Inclua uma estimativa de tempo se possível
    5. Mantenha o tom do Orkut (nostalgia, comunidade)
    
    Exemplo de formato desejado:
    "🔧 Detectamos uma lentidão no carregamento das comunidades. Nossa equipe já está trabalhando na correção. Estimativa: 15 minutos. Obrigado pela paciência! 💙"
    
    Retorne APENAS a mensagem, sem aspas ou formatação extra.
    `

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          topK: 1,
          topP: 1,
          maxOutputTokens: 300,
        }
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const message = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      return message || getDefaultMessage(bugData.severity)
    }
    
    return getDefaultMessage(bugData.severity)
    
  } catch (error) {
    console.error('Erro ao gerar mensagem com IA:', error)
    return getDefaultMessage(bugData.severity)
  }
}

// Mensagens padrão baseadas na severidade
function getDefaultMessage(severity: string): string {
  const messages = {
    'critical': '🚨 Sistema temporariamente indisponível. Trabalhando em correção urgente. Atualizações em breve!',
    'high': '⚠️ Problemas detectados em algumas funcionalidades. Equipe técnica investigando. Obrigado pela paciência!',
    'medium': '🔧 Realizando otimizações no sistema. Podem ocorrer lentidões temporárias.',
    'low': '✨ Pequenos ajustes em andamento para melhorar sua experiência no Orkut!'
  }
  
  return messages[severity as keyof typeof messages] || messages.medium
}

// Função para determinar sistemas afetados baseado no tipo de bug
function determineAffectedSystems(bugCategory: string): string[] {
  const systemMapping = {
    'performance': ['web_interface', 'real_time_updates'],
    'ui': ['web_interface'],
    'functionality': ['communities', 'chat_system'],
    'security': ['web_interface', 'chat_system', 'communities'],
    'accessibility': ['web_interface'],
    'database': ['communities', 'chat_system', 'media_upload'],
    'api': ['real_time_updates', 'chat_system']
  }
  
  return systemMapping[bugCategory as keyof typeof systemMapping] || ['web_interface']
}

// Função para estimar tempo de correção
function estimateFixTime(severity: string, category: string): string {
  const timeEstimates = {
    'critical': '30-60 minutos',
    'high': '1-3 horas',
    'medium': '2-6 horas',
    'low': '4-24 horas'
  }
  
  return timeEstimates[severity as keyof typeof timeEstimates] || '2-6 horas'
}

// Criar nova notificação
export async function POST(request: NextRequest) {
  try {
    const { 
      bug_report, 
      auto_post_to_feed = true, 
      custom_message,
      notify_users = true 
    } = await request.json()

    console.log('🔔 Criando notificação de bug para o feed...')

    // Determinar tipo de notificação baseado no bug
    let notificationType: BugNotification['type'] = 'bug_alert'
    if (bug_report.category === 'performance') {
      notificationType = 'performance_warning'
    } else if (bug_report.description?.includes('deploy')) {
      notificationType = 'deploy_status'
    }

    // Determinar sistemas afetados
    const affectedSystems = determineAffectedSystems(bug_report.category || 'functionality')
    
    // Gerar mensagem personalizada ou usar a customizada
    let notificationMessage = custom_message
    if (!notificationMessage) {
      notificationMessage = await generateNotificationMessage({
        type: notificationType,
        severity: bug_report.severity,
        technical_description: bug_report.description,
        affected_systems: affectedSystems
      })
    }

    // Criar notificação
    const notification: BugNotification = {
      id: `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: notificationType,
      severity: bug_report.severity || 'medium',
      title: `Sistema Orkut - ${bug_report.severity === 'critical' ? 'Alerta Crítico' : 'Atualização'}`,
      message: notificationMessage,
      details: bug_report.recommendation || 'Nossa equipe técnica está trabalhando na correção.',
      timestamp: new Date().toISOString(),
      status: 'investigating',
      affected_systems: affectedSystems,
      estimated_fix_time: estimateFixTime(bug_report.severity, bug_report.category),
      actions_taken: [
        '🔍 Problema identificado automaticamente',
        '👨‍💻 Equipe técnica notificada',
        '📊 Monitoramento ativo iniciado'
      ]
    }

    // Adicionar à "base de dados"
    notificationsDB.push(notification)
    systemStatusDB.active_notifications.push(notification)
    
    // Atualizar status dos sistemas afetados
    affectedSystems.forEach(system => {
      if (systemStatusDB.services[system]) {
        if (notification.severity === 'critical') {
          systemStatusDB.services[system].status = 'outage'
        } else if (notification.severity === 'high') {
          systemStatusDB.services[system].status = 'degraded'
        }
        systemStatusDB.services[system].last_incident = notification.timestamp
      }
    })

    // Atualizar status geral
    const criticalCount = systemStatusDB.active_notifications.filter(n => n.severity === 'critical').length
    const highCount = systemStatusDB.active_notifications.filter(n => n.severity === 'high').length
    
    if (criticalCount > 0) {
      systemStatusDB.overall_status = 'major_outage'
    } else if (highCount > 0) {
      systemStatusDB.overall_status = 'degraded'
    } else if (systemStatusDB.active_notifications.length > 0) {
      systemStatusDB.overall_status = 'degraded'
    }
    
    systemStatusDB.last_updated = new Date().toISOString()

    // Simular postagem no feed (em um sistema real, isso integraria com a API de posts)
    const feedPost = auto_post_to_feed ? {
      id: `system_post_${notification.id}`,
      author: 'Sistema Orkut',
      avatar: '🤖',
      content: notification.message,
      timestamp: notification.timestamp,
      type: 'system_announcement',
      reactions: { likes: 0, comments: [] },
      priority: notification.severity === 'critical' ? 'high' : 'normal'
    } : null

    console.log(`✅ Notificação criada: ${notification.id}`)

    return NextResponse.json({
      notification,
      feed_post: feedPost,
      system_status: systemStatusDB.overall_status,
      message: 'Notificação criada e postada no feed com sucesso'
    })

  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    return NextResponse.json({ 
      error: 'Erro interno ao criar notificação',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Obter notificações ativas
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') // active, resolved, all
    const severity = url.searchParams.get('severity')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    let notifications = [...notificationsDB]

    // Filtrar por status
    if (status && status !== 'all') {
      notifications = notifications.filter(n => n.status === status)
    }

    // Filtrar por severidade
    if (severity) {
      notifications = notifications.filter(n => n.severity === severity)
    }

    // Ordenar por timestamp (mais recente primeiro)
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Limitar resultados
    notifications = notifications.slice(0, limit)

    return NextResponse.json({
      notifications,
      total_count: notificationsDB.length,
      active_count: notificationsDB.filter(n => n.status === 'active' || n.status === 'investigating').length,
      system_status: systemStatusDB
    })

  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Atualizar status de notificação
export async function PATCH(request: NextRequest) {
  try {
    const { 
      notification_id, 
      status, 
      resolution_message,
      actions_taken 
    } = await request.json()

    console.log(`🔄 Atualizando notificação ${notification_id}...`)

    const notificationIndex = notificationsDB.findIndex(n => n.id === notification_id)
    if (notificationIndex === -1) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    const notification = notificationsDB[notificationIndex]
    
    // Atualizar notificação
    notification.status = status
    if (actions_taken) {
      notification.actions_taken = [...(notification.actions_taken || []), ...actions_taken]
    }

    // Se resolvido, gerar mensagem de resolução
    if (status === 'resolved') {
      const resolutionText = resolution_message || await generateNotificationMessage({
        type: 'resolution',
        severity: 'low',
        technical_description: `Problema "${notification.title}" foi resolvido com sucesso`,
        affected_systems: notification.affected_systems
      })

      // Criar notificação de resolução
      const resolutionNotification: BugNotification = {
        id: `resolution_${Date.now()}`,
        type: 'bug_alert',
        severity: 'low',
        title: 'Problema Resolvido ✅',
        message: resolutionText,
        timestamp: new Date().toISOString(),
        status: 'resolved',
        affected_systems: notification.affected_systems
      }

      notificationsDB.push(resolutionNotification)

      // Restaurar status dos sistemas
      notification.affected_systems.forEach(system => {
        if (systemStatusDB.services[system]) {
          systemStatusDB.services[system].status = 'operational'
        }
      })
    }

    // Atualizar status geral do sistema
    const activeNotifications = notificationsDB.filter(n => 
      n.status === 'active' || n.status === 'investigating'
    )
    
    systemStatusDB.active_notifications = activeNotifications
    
    const criticalActive = activeNotifications.filter(n => n.severity === 'critical').length
    const highActive = activeNotifications.filter(n => n.severity === 'high').length
    
    if (criticalActive > 0) {
      systemStatusDB.overall_status = 'major_outage'
    } else if (highActive > 0) {
      systemStatusDB.overall_status = 'degraded'
    } else if (activeNotifications.length > 0) {
      systemStatusDB.overall_status = 'degraded'
    } else {
      systemStatusDB.overall_status = 'operational'
    }
    
    systemStatusDB.last_updated = new Date().toISOString()

    return NextResponse.json({
      updated_notification: notification,
      system_status: systemStatusDB.overall_status,
      message: `Notificação atualizada para status: ${status}`
    })

  } catch (error) {
    console.error('Erro ao atualizar notificação:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Limpar notificações antigas
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const older_than_hours = parseInt(url.searchParams.get('older_than_hours') || '24')
    const status_to_clean = url.searchParams.get('status') || 'resolved'

    const cutoffTime = new Date(Date.now() - (older_than_hours * 60 * 60 * 1000))
    
    const initialCount = notificationsDB.length
    
    notificationsDB = notificationsDB.filter(notification => {
      if (notification.status === status_to_clean && new Date(notification.timestamp) < cutoffTime) {
        return false // Remove esta notificação
      }
      return true // Mantém esta notificação
    })
    
    const removedCount = initialCount - notificationsDB.length
    
    // Atualizar notificações ativas no status do sistema
    systemStatusDB.active_notifications = notificationsDB.filter(n => 
      n.status === 'active' || n.status === 'investigating'
    )
    
    systemStatusDB.last_updated = new Date().toISOString()

    return NextResponse.json({
      message: `${removedCount} notificações removidas com sucesso`,
      remaining_notifications: notificationsDB.length,
      system_status: systemStatusDB.overall_status
    })

  } catch (error) {
    console.error('Erro ao limpar notificações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
