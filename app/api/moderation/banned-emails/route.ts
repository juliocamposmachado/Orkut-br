import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// GET - Listar emails banidos (público para transparência)
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: emails, error } = await supabase
      .from('banned_emails')
      .select(`
        id,
        email,
        ban_reason,
        domain_ban,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar emails banidos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar emails banidos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ emails })

  } catch (error) {
    console.error('Erro na API de emails banidos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Banir email (apenas admins)
export async function POST(req: NextRequest) {
  try {
    const { email, reason, domainBan = false } = await req.json()

    if (!email || !reason) {
      return NextResponse.json(
        { error: 'Email e motivo são obrigatórios' },
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

    // Verificar se o usuário é admin/moderador
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem banir emails.' },
        { status: 403 }
      )
    }

    // Verificar se o email já está banido
    const { data: existingBan } = await supabase
      .from('banned_emails')
      .select('id')
      .eq('email', email)
      .single()

    if (existingBan) {
      return NextResponse.json(
        { error: 'Este email já está banido' },
        { status: 400 }
      )
    }

    // Criar banimento
    const { data: bannedEmail, error: banError } = await supabase
      .from('banned_emails')
      .insert({
        email: email,
        banned_by: user.id,
        ban_reason: reason,
        domain_ban: domainBan
      })
      .select()
      .single()

    if (banError) {
      console.error('Erro ao banir email:', banError)
      return NextResponse.json(
        { error: 'Erro ao processar banimento' },
        { status: 500 }
      )
    }

    console.log(`🚫 Email banido:`, {
      email,
      domainBan,
      bannedBy: user.id,
      reason
    })

    return NextResponse.json({
      success: true,
      message: 'Email banido com sucesso',
      bannedEmail
    })

  } catch (error) {
    console.error('Erro na API de banimento de email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
