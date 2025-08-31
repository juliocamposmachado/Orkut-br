import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Verificar se Supabase está configurado
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Criar cliente administrativo apenas se configurado
const supabaseAdmin = (supabaseUrl && supabaseServiceKey &&
                     !supabaseUrl.includes('placeholder') &&
                     !supabaseUrl.includes('your_') &&
                     supabaseUrl.startsWith('https://'))
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export interface BugReport {
  id?: number
  user_id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  url?: string
  browser_info?: string
  screen_resolution?: string
  user_agent?: string
  created_at?: string
  status?: 'open' | 'in_progress' | 'resolved' | 'closed'
  assigned_to?: string
  resolution_notes?: string
}

export async function GET(request: NextRequest) {
  try {
    // Se Supabase não estiver configurado, retornar dados demo
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: true,
        reports: [],
        statistics: { total: 0, byStatus: {}, bySeverity: {} },
        demo: true
      })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verificar autenticação
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de acesso obrigatório' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar se é admin/moderador
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Apenas administradores podem acessar bug reports' }, { status: 403 })
    }

    // Construir query
    let query = supabaseAdmin
      .from('bug_reports')
      .select(`
        *,
        reporter:profiles!bug_reports_user_id_fkey(display_name, username, photo_url),
        assignee:profiles!bug_reports_assigned_to_fkey(display_name, username)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: reports, error } = await query

    if (error) {
      throw error
    }

    // Estatísticas
    const { data: stats } = await supabaseAdmin
      .from('bug_reports')
      .select('status, severity')

    const statistics = stats?.reduce((acc, report) => {
      acc.total++
      acc.byStatus[report.status] = (acc.byStatus[report.status] || 0) + 1
      acc.bySeverity[report.severity] = (acc.bySeverity[report.severity] || 0) + 1
      return acc
    }, {
      total: 0,
      byStatus: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>
    }) || { total: 0, byStatus: {}, bySeverity: {} }

    return NextResponse.json({
      success: true,
      reports: reports || [],
      statistics
    })

  } catch (error) {
    console.error('Erro ao buscar bug reports:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Se Supabase não estiver configurado, retornar erro amigável
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Funcionalidade de bug reports não disponível',
        demo: true 
      }, { status: 503 })
    }

    const body = await request.json()
    const {
      title,
      description,
      severity = 'medium',
      category,
      url,
      browserInfo,
      screenResolution,
      userAgent
    } = body

    // Validações
    if (!title || !description) {
      return NextResponse.json({
        error: 'Título e descrição são obrigatórios'
      }, { status: 400 })
    }

    // Verificar autenticação (usuário pode reportar bugs)
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de acesso obrigatório' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Criar bug report
    const { data: bugReport, error } = await supabaseAdmin
      .from('bug_reports')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        severity,
        category: category || 'general',
        url,
        browser_info: browserInfo,
        screen_resolution: screenResolution,
        user_agent: userAgent,
        status: 'open'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Notificar admins/moderadores sobre novo bug report
    await notifyModerators(bugReport)

    return NextResponse.json({
      success: true,
      message: 'Bug report enviado com sucesso!',
      bugReport
    })

  } catch (error) {
    console.error('Erro ao criar bug report:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Se Supabase não estiver configurado, retornar erro amigável
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Funcionalidade de bug reports não disponível',
        demo: true 
      }, { status: 503 })
    }

    const body = await request.json()
    const { id, status, assigned_to, resolution_notes } = body

    // Verificar autenticação
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de acesso obrigatório' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar se é admin/moderador
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Apenas administradores podem atualizar bug reports' }, { status: 403 })
    }

    // Atualizar bug report
    const updateData: any = {}
    if (status) updateData.status = status
    if (assigned_to) updateData.assigned_to = assigned_to
    if (resolution_notes) updateData.resolution_notes = resolution_notes
    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = user.id
    }

    const { data: updatedReport, error } = await supabaseAdmin
      .from('bug_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Bug report atualizado com sucesso',
      bugReport: updatedReport
    })

  } catch (error) {
    console.error('Erro ao atualizar bug report:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

async function notifyModerators(bugReport: any) {
  try {
    if (!supabaseAdmin) {
      console.warn('Supabase não configurado - pular notificação de moderadores')
      return
    }

    // Buscar todos os admins e moderadores
    const { data: moderators } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name')
      .in('role', ['admin', 'moderator'])

    if (moderators && moderators.length > 0) {
      // Criar notificações para cada moderador
      const notifications = moderators.map(mod => ({
        user_id: mod.id,
        type: 'bug_report',
        title: '🐛 Novo Bug Report',
        message: `Bug reportado: "${bugReport.title}" (${bugReport.severity})`,
        data: { bug_report_id: bugReport.id },
        created_at: new Date().toISOString()
      }))

      await supabaseAdmin
        .from('notifications')
        .insert(notifications)
    }
  } catch (error) {
    console.error('Erro ao notificar moderadores:', error)
  }
}
