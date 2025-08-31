import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { email } = body

    // Validar entrada
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já existe convite pendente para este email
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Já existe um convite pendente para este email' },
        { status: 409 }
      )
    }

    // Verificar se o email já está registrado no sistema
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está registrado no sistema' },
        { status: 409 }
      )
    }

    // Gerar token único e código de verificação
    const invitationToken = crypto.randomUUID()
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Criar convite no banco
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert([
        {
          inviter_id: user.id,
          email: email.trim().toLowerCase(),
          token: invitationToken,
          verification_code: verificationCode,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
        }
      ])
      .select()
      .single()

    if (inviteError) {
      console.error('Erro ao criar convite:', inviteError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Criar URL de convite
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/aceitar-convite?token=${invitationToken}`

    // Template do email de convite
    const emailSubject = encodeURIComponent(`${profile.display_name} te convidou para o Orkut Retrô!`)
    const emailBody = encodeURIComponent(`Olá!

${profile.display_name} te convidou para participar do Orkut Retrô - a nostalgia dos anos 2000 de volta, mas muito melhor!

🎉 Clique no link abaixo para aceitar o convite:
${inviteUrl}

🔑 Seu código de verificação: ${verificationCode}

✨ O que te espera no Orkut Retrô:
• Conecte-se com amigos de verdade
• Comunidades incríveis
• Chamadas de voz e vídeo
• DJ Orky com música personalizada
• Interface nostálgica mas moderna
• E muito mais!

Este convite é válido por 7 dias.

Seja bem-vindo(a) à nossa comunidade!

---
Orkut Retrô - Revivendo a magia dos anos 2000
${baseUrl}`)

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        verificationCode: invitation.verification_code,
        inviteUrl,
        emailSubject,
        emailBody,
        gmailUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${emailSubject}&body=${emailBody}`
      }
    })

  } catch (error) {
    console.error('Erro na API de convites:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
