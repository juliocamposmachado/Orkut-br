import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário está autenticado
    const cookieStore = cookies()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { targetUserId, callType, offer } = body

    if (!targetUserId || !callType) {
      return NextResponse.json(
        { error: 'targetUserId e callType são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar informações do usuário que está chamando
    const { data: callerProfile, error: callerError } = await supabase
      .from('profiles')
      .select('id, username, display_name, photo_url')
      .eq('id', user.id)
      .single()

    if (callerError || !callerProfile) {
      return NextResponse.json(
        { error: 'Perfil do usuário não encontrado' },
        { status: 404 }
      )
    }

    // Buscar informações do usuário alvo
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('id, username, display_name, photo_url')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetProfile) {
      return NextResponse.json(
        { error: 'Usuário alvo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário alvo está online
    const { data: presenceData, error: presenceError } = await supabase
      .from('user_presence')
      .select('is_online, last_seen')
      .eq('user_id', targetUserId)
      .single()

    if (presenceError || !presenceData?.is_online) {
      return NextResponse.json(
        { error: 'Usuário não está online' },
        { status: 400 }
      )
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Criar notificação de chamada no banco
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        profile_id: targetUserId,
        type: 'incoming_call',
        payload: {
          call_id: callId,
          call_type: callType,
          from_user: {
            id: callerProfile.id,
            username: callerProfile.username,
            display_name: callerProfile.display_name,
            photo_url: callerProfile.photo_url
          },
          offer: offer,
          timestamp: new Date().toISOString()
        },
        read: false
      })

    if (notificationError) {
      console.error('Erro ao criar notificação:', notificationError)
      return NextResponse.json(
        { error: 'Erro ao enviar notificação de chamada' },
        { status: 500 }
      )
    }

    // Criar registro da chamada na tabela call_signals para WebRTC
    const { error: signalError } = await supabase
      .from('call_signals')
      .insert({
        from_user_id: user.id,
        to_user_id: targetUserId,
        signal_type: 'call_offer',
        signal_data: {
          call_id: callId,
          call_type: callType,
          offer: offer,
          caller_info: {
            id: callerProfile.id,
            username: callerProfile.username,
            display_name: callerProfile.display_name,
            photo_url: callerProfile.photo_url
          }
        }
      })

    if (signalError) {
      console.error('Erro ao criar sinal de chamada:', signalError)
    }

    return NextResponse.json({
      success: true,
      message: 'Notificação de chamada enviada',
      callId,
      targetUser: {
        id: targetProfile.id,
        username: targetProfile.username,
        display_name: targetProfile.display_name,
        photo_url: targetProfile.photo_url
      }
    })

  } catch (error) {
    console.error('Erro na API call-notification:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Endpoint para responder à chamada (aceitar/rejeitar)
export async function PUT(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { callId, action, answer } = body // action: 'accept' | 'reject'

    if (!callId || !action) {
      return NextResponse.json(
        { error: 'callId e action são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar a notificação de chamada
    const { data: notificationData, error: notificationError } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', user.id)
      .eq('type', 'incoming_call')
      .contains('payload', { call_id: callId })
      .single()

    if (notificationError || !notificationData) {
      return NextResponse.json(
        { error: 'Chamada não encontrada' },
        { status: 404 }
      )
    }

    const callerUserId = notificationData.payload.from_user.id

    // Criar sinal de resposta
    const { error: signalError } = await supabase
      .from('call_signals')
      .insert({
        from_user_id: user.id,
        to_user_id: callerUserId,
        signal_type: action === 'accept' ? 'call_accepted' : 'call_rejected',
        signal_data: {
          call_id: callId,
          action,
          answer: action === 'accept' ? answer : null,
          timestamp: new Date().toISOString()
        }
      })

    if (signalError) {
      console.error('Erro ao criar sinal de resposta:', signalError)
    }

    // Marcar notificação como lida
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationData.id)

    if (updateError) {
      console.error('Erro ao marcar notificação como lida:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: `Chamada ${action === 'accept' ? 'aceita' : 'rejeitada'}`,
      action
    })

  } catch (error) {
    console.error('Erro na API call-notification PUT:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
