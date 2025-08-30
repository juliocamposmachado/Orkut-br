import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

// Interface para configuração do WhatsApp
interface WhatsAppConfig {
  id?: string
  user_id: string
  is_enabled: boolean
  allow_calls: boolean
  voice_call_link?: string
  video_call_link?: string
  whatsapp_phone?: string
  whatsapp_groups?: Array<{ name: string; link: string }>
  created_at?: string
  updated_at?: string
}

// GET - Buscar configuração do WhatsApp do usuário
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Buscar configuração existente
    const { data, error } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao buscar configuração WhatsApp:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar configurações', details: error.message },
        { status: 500 }
      )
    }

    // Se não existe configuração, retornar valores padrão
    if (!data) {
      return NextResponse.json({
        success: true,
        data: {
          user_id: user.id,
          is_enabled: false,
          allow_calls: true,
          voice_call_link: '',
          video_call_link: '',
          whatsapp_phone: '',
          whatsapp_groups: []
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Erro na API WhatsApp GET:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST/PUT - Salvar/atualizar configuração do WhatsApp
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { is_enabled, allow_calls, voice_call_link, video_call_link, whatsapp_phone, whatsapp_groups } = body

    // Validar dados
    if (typeof is_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'is_enabled deve ser boolean' },
        { status: 400 }
      )
    }

    // Validar links do WhatsApp se fornecidos
    if (voice_call_link && !validateWhatsAppLink(voice_call_link, 'voice')) {
      return NextResponse.json(
        { error: 'Link de voz inválido. Use o formato: https://call.whatsapp.com/voice/CODIGO' },
        { status: 400 }
      )
    }

    if (video_call_link && !validateWhatsAppLink(video_call_link, 'video')) {
      return NextResponse.json(
        { error: 'Link de vídeo inválido. Use o formato: https://call.whatsapp.com/video/CODIGO' },
        { status: 400 }
      )
    }

    // Validar telefone WhatsApp se fornecido
    if (whatsapp_phone && !validatePhone(whatsapp_phone)) {
      return NextResponse.json(
        { error: 'Número de telefone inválido. Use apenas números (8-15 dígitos)' },
        { status: 400 }
      )
    }

    // Validar grupos WhatsApp se fornecidos
    if (whatsapp_groups && !validateWhatsAppGroups(whatsapp_groups)) {
      return NextResponse.json(
        { error: 'Grupos inválidos. Máximo 5 grupos com nome e link válidos' },
        { status: 400 }
      )
    }

    // Usar UPSERT para inserir ou atualizar
    const { data, error } = await supabase
      .from('whatsapp_config')
      .upsert({
        user_id: user.id,
        is_enabled,
        allow_calls: allow_calls !== undefined ? allow_calls : true,
        voice_call_link: voice_call_link || null,
        video_call_link: video_call_link || null,
        whatsapp_phone: whatsapp_phone || null,
        whatsapp_groups: whatsapp_groups || [],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar configuração WhatsApp:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar configurações', details: error.message },
        { status: 500 }
      )
    }

    // Registrar log de atividade
    await logWhatsAppActivity(user.id, 'config_updated', {
      is_enabled,
      allow_calls,
      has_voice_link: !!voice_call_link,
      has_video_link: !!video_call_link,
      has_phone: !!whatsapp_phone,
      groups_count: whatsapp_groups?.length || 0
    }, request)

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      data: data
    })

  } catch (error) {
    console.error('Erro na API WhatsApp POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Desabilitar WhatsApp para o usuário
export async function DELETE(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Desabilitar configuração
    const { error } = await supabase
      .from('whatsapp_config')
      .upsert({
        user_id: user.id,
        is_enabled: false,
        allow_calls: false,
        voice_call_link: null,
        video_call_link: null,
        whatsapp_phone: null,
        whatsapp_groups: [],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Erro ao desabilitar WhatsApp:', error)
      return NextResponse.json(
        { error: 'Erro ao desabilitar WhatsApp', details: error.message },
        { status: 500 }
      )
    }

    // Registrar log
    await logWhatsAppActivity(user.id, 'config_updated', {
      action: 'disabled'
    }, request)

    return NextResponse.json({
      success: true,
      message: 'WhatsApp desabilitado com sucesso'
    })

  } catch (error) {
    console.error('Erro na API WhatsApp DELETE:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função utilitária para validar links do WhatsApp
function validateWhatsAppLink(link: string, type: 'voice' | 'video'): boolean {
  if (!link) return true // Link vazio é válido
  
  const pattern = new RegExp(`^https://call\\.whatsapp\\.com/${type}/[A-Za-z0-9_-]+$`)
  return pattern.test(link)
}

// Função para validar telefone WhatsApp
function validatePhone(phone: string): boolean {
  if (!phone) return true // Telefone vazio é válido
  const cleanPhone = phone.replace(/\D/g, '')
  return cleanPhone.length >= 8 && cleanPhone.length <= 15
}

// Função para validar grupos WhatsApp
function validateWhatsAppGroups(groups: Array<{ name: string; link: string }>): boolean {
  if (!groups || groups.length === 0) return true // Array vazio é válido
  if (groups.length > 5) return false // Máximo 5 grupos
  
  return groups.every(group => {
    if (!group.name || !group.link) return false
    if (group.name.trim().length === 0) return false
    return /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+$/.test(group.link)
  })
}

// Função para registrar logs de atividade
async function logWhatsAppActivity(
  userId: string, 
  activityType: string, 
  activityData: any,
  request: NextRequest
) {
  try {
    const userAgent = request.headers.get('user-agent') || ''
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown'

    await supabase
      .from('whatsapp_activity_log')
      .insert({
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData,
        ip_address: ipAddress,
        user_agent: userAgent
      })
  } catch (error) {
    console.error('Erro ao registrar log de atividade:', error)
    // Não falha a operação principal se o log falhar
  }
}

// Configurar CORS se necessário
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
