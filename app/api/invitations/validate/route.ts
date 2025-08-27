import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar convite pelo token
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select(`
        *,
        profiles!invitations_inviter_id_fkey (
          display_name,
          photo_url,
          username
        )
      `)
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Convite não encontrado ou já utilizado' },
        { status: 404 }
      )
    }

    // Verificar se o convite não expirou
    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)
    
    if (now > expiresAt) {
      // Marcar convite como expirado
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json(
        { error: 'Convite expirado' },
        { status: 410 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        verificationCode: invitation.verification_code,
        inviter: invitation.profiles,
        invitedAt: invitation.created_at,
        expiresAt: invitation.expires_at
      }
    })

  } catch (error) {
    console.error('Erro na validação do convite:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { token, status } = body

    if (!token || !status) {
      return NextResponse.json(
        { error: 'Token e status são obrigatórios' },
        { status: 400 }
      )
    }

    // Atualizar status do convite
    const { data: invitation, error: updateError } = await supabase
      .from('invitations')
      .update({ 
        status,
        accepted_at: status === 'accepted' ? new Date().toISOString() : null
      })
      .eq('token', token)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar convite:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar convite' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation
    })

  } catch (error) {
    console.error('Erro na atualização do convite:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
