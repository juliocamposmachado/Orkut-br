import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se as variáveis estão configuradas
if (!supabaseUrl || !supabaseServiceKey || 
    supabaseUrl.includes('placeholder') || 
    supabaseUrl.includes('your_') ||
    !supabaseUrl.startsWith('https://')) {
  console.warn('Supabase não configurado para refresh-session API')
}

// Criar cliente apenas se configurado corretamente
const supabase = (supabaseUrl && supabaseServiceKey &&
                 !supabaseUrl.includes('placeholder') &&
                 !supabaseUrl.includes('your_') &&
                 supabaseUrl.startsWith('https://'))
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

/**
 * POST /api/auth/refresh-session - Atualizar sessão do usuário
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Serviço de autenticação não disponível' 
      }, { status: 503 })
    }

    const { refresh_token } = await request.json()
    
    if (!refresh_token) {
      return NextResponse.json(
        { error: 'Refresh token não fornecido' },
        { status: 400 }
      )
    }

    // Tentar renovar a sessão
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    })

    if (error) {
      console.error('Erro ao renovar sessão:', error)
      return NextResponse.json(
        { error: 'Erro ao renovar sessão', details: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      session: data.session,
      user: data.user,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na renovação de sessão:', error)
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
 * GET /api/auth/refresh-session - Verificar sessão atual
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Serviço de autenticação não disponível',
        valid: false 
      }, { status: 503 })
    }

    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Header de autenticação não fornecido' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verificar se o token é válido
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado', details: error?.message },
        { status: 401 }
      )
    }

    // Buscar informações do perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at
      },
      profile: profile || null,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na verificação de sessão:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
