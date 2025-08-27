import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('📨 Iniciando POST /api/call-notification')
    
    // Obter token do cabeçalho Authorization
    const authHeader = request.headers.get('authorization')
    console.log('🔑 Authorization header present:', !!authHeader)
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Token de autenticação não fornecido ou inválido')
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🎫 Token extraído com sucesso, tamanho:', token.length)
    
    // Verificar se o usuário está autenticado usando o token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError) {
      console.error('❌ Erro de autenticação:', authError)
      return NextResponse.json(
        { error: 'Token de autenticação inválido', details: authError.message },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.error('❌ Usuário não encontrado')
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }
    
    console.log('✅ Usuário autenticado:', user.id)

    const body = await request.json()
    const { targetUserId, callType, offer } = body
    console.log('📝 Dados recebidos:', { targetUserId, callType, hasOffer: !!offer })

    if (!targetUserId || !callType) {
      console.error('❌ Dados obrigatórios ausentes')
      return NextResponse.json(
        { error: 'targetUserId e callType são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar informações do usuário que está chamando
    console.log('👤 Buscando perfil do usuário que chama:', user.id)
    const { data: callerProfile, error: callerError } = await supabase
      .from('profiles')
      .select('id, username, display_name, photo_url')
      .eq('id', user.id)
      .single()

    if (callerError) {
      console.error('❌ Erro ao buscar perfil do usuário:', callerError)
      return NextResponse.json(
        { error: 'Perfil do usuário não encontrado', details: callerError.message },
        { status: 404 }
      )
    }
    
    if (!callerProfile) {
      console.error('❌ Perfil do usuário não existe')
      return NextResponse.json(
        { error: 'Perfil do usuário não encontrado' },
        { status: 404 }
      )
    }
    
    console.log('✅ Perfil do usuário encontrado:', callerProfile.display_name)

    // Buscar informações do usuário alvo
    console.log('🎯 Buscando perfil do usuário alvo:', targetUserId)
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('id, username, display_name, photo_url')
      .eq('id', targetUserId)
      .single()

    if (targetError) {
      console.error('❌ Erro ao buscar usuário alvo:', targetError)
      return NextResponse.json(
        { error: 'Usuário alvo não encontrado', details: targetError.message },
        { status: 404 }
      )
    }
    
    if (!targetProfile) {
      console.error('❌ Usuário alvo não existe')
      return NextResponse.json(
        { error: 'Usuário alvo não encontrado' },
        { status: 404 }
      )
    }
    
    console.log('✅ Usuário alvo encontrado:', targetProfile.display_name)

    // Verificar se o usuário alvo está online (permitir auto-chamadas para teste)
    const isTestCall = targetUserId === user.id
    console.log('🧪 Auto-chamada de teste:', isTestCall)
    
    if (!isTestCall) {
      console.log('📶 Verificando status online do usuário alvo')
      const { data: presenceData, error: presenceError } = await supabase
        .from('user_presence')
        .select('is_online, last_seen')
        .eq('user_id', targetUserId)
        .single()

      if (presenceError) {
        console.error('❌ Erro ao verificar presença:', presenceError)
      }
      
      if (!presenceData?.is_online) {
        console.warn('⚠️ Usuário não está online, mas continuando para teste')
        // Em modo de teste, permitir mesmo se offline
        // return NextResponse.json(
        //   { error: 'Usuário não está online' },
        //   { status: 400 }
        // )
      } else {
        console.log('✅ Usuário alvo está online')
      }
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log('📝 Criando notificação de chamada no banco...')
    
    // Criar notificação de chamada no banco
    const { data: notificationData, error: notificationError } = await supabase
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
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (notificationError) {
      console.error('❌ Erro ao criar notificação:', notificationError)
      return NextResponse.json(
        { error: 'Erro ao enviar notificação de chamada', details: notificationError.message },
        { status: 500 }
      )
    }
    
    console.log('✅ Notificação criada com sucesso:', notificationData)
    
    // Tentar enviar via realtime também para garantir
    try {
      const realtimePayload = {
        type: 'incoming_call',
        call_id: callId,
        call_type: callType,
        from_user: {
          id: callerProfile.id,
          username: callerProfile.username,
          display_name: callerProfile.display_name,
          photo_url: callerProfile.photo_url
        },
        timestamp: new Date().toISOString()
      }
      
      // Broadcast via realtime channel
      await supabase.channel(`call_notifications_${targetUserId}`).send({
        type: 'broadcast',
        event: 'incoming_call',
        payload: realtimePayload
      })
      
      console.log('✅ Sinal realtime enviado')
    } catch (realtimeError) {
      console.warn('⚠️ Erro no realtime (não crítico):', realtimeError)
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
