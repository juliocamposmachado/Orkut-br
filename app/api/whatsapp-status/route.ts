import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = (supabaseUrl && supabaseServiceKey &&
                 !supabaseUrl.includes('placeholder') &&
                 !supabaseUrl.includes('your_') &&
                 supabaseUrl.startsWith('https://'))
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

/**
 * POST /api/whatsapp-status - Atualizar status do WhatsApp do usuário
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Serviço não disponível' 
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
    const { 
      isOnline, 
      lastActivity, 
      whatsappTabActive,
      consentGiven,
      detectionMethod 
    } = body

    // Validações
    if (typeof isOnline !== 'boolean') {
      return NextResponse.json({ 
        error: 'Status online deve ser boolean' 
      }, { status: 400 })
    }

    // Atualizar status no perfil
    const updateData: any = {
      whatsapp_online: isOnline,
      whatsapp_last_activity: lastActivity || new Date().toISOString(),
      whatsapp_updated_at: new Date().toISOString()
    }

    // Se for a primeira vez, salvar consentimento
    if (consentGiven !== undefined) {
      updateData.whatsapp_monitoring_consent = consentGiven
      updateData.whatsapp_consent_date = new Date().toISOString()
    }

    // Adicionar método de detecção para debug
    if (detectionMethod) {
      updateData.whatsapp_detection_method = detectionMethod
    }

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select('id, whatsapp_online, whatsapp_last_activity')
      .single()

    if (updateError) {
      console.error('Erro ao atualizar status WhatsApp:', updateError)
      return NextResponse.json({ 
        error: 'Erro ao atualizar status',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile: profile,
      message: 'Status WhatsApp atualizado com sucesso',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API WhatsApp status:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

/**
 * GET /api/whatsapp-status/[userId] - Buscar status do WhatsApp de um usuário
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Serviço não disponível' 
      }, { status: 503 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ 
        error: 'ID do usuário necessário' 
      }, { status: 400 })
    }

    // Buscar status WhatsApp do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        whatsapp_online,
        whatsapp_last_activity,
        whatsapp_monitoring_consent,
        whatsapp_updated_at
      `)
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado' 
      }, { status: 404 })
    }

    // Verificar se o usuário deu consentimento
    if (!profile.whatsapp_monitoring_consent) {
      return NextResponse.json({
        success: true,
        whatsapp_status: {
          enabled: false,
          reason: 'Usuário não autorizou monitoramento'
        }
      })
    }

    // Verificar se o status não está muito desatualizado (15 minutos)
    const lastUpdate = new Date(profile.whatsapp_updated_at || 0)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60)

    const isRecentlyUpdated = diffMinutes <= 15

    return NextResponse.json({
      success: true,
      whatsapp_status: {
        enabled: true,
        online: profile.whatsapp_online && isRecentlyUpdated,
        lastActivity: profile.whatsapp_last_activity,
        lastUpdate: profile.whatsapp_updated_at,
        isStale: !isRecentlyUpdated
      },
      user: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name
      }
    })

  } catch (error) {
    console.error('Erro ao buscar status WhatsApp:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
