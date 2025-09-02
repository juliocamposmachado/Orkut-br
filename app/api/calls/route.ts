import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, callId, targetUserId, callType, callerInfo } = body

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    switch (action) {
      case 'start_call':
        return await handleStartCall(user.id, targetUserId, callType, callerInfo)
      
      case 'answer_call':
        return await handleAnswerCall(callId, user.id)
      
      case 'decline_call':
        return await handleDeclineCall(callId, user.id)
      
      case 'end_call':
        return await handleEndCall(callId, user.id)
      
      default:
        return NextResponse.json(
          { success: false, error: 'Ação não reconhecida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro na API de chamadas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function handleStartCall(callerId: string, targetUserId: string, callType: 'video' | 'audio', callerInfo: any) {
  try {
    // Verificar se o usuário alvo existe
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id, display_name, photo_url, username')
      .eq('id', targetUserId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já existe uma chamada ativa entre esses usuários
    const { data: activeCall, error: activeCallError } = await supabase
      .from('calls')
      .select('id')
      .or(`and(caller_id.eq.${callerId},receiver_id.eq.${targetUserId}),and(caller_id.eq.${targetUserId},receiver_id.eq.${callerId})`)
      .in('status', ['ringing', 'connected'])
      .single()

    if (activeCall) {
      return NextResponse.json(
        { success: false, error: 'Já existe uma chamada ativa com este usuário' },
        { status: 409 }
      )
    }

    // Criar nova chamada
    const { data: newCall, error: callError } = await supabase
      .from('calls')
      .insert({
        caller_id: callerId,
        receiver_id: targetUserId,
        call_type: callType,
        status: 'ringing',
        caller_info: callerInfo,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (callError) {
      throw callError
    }

    console.log(`📞 Nova chamada iniciada: ${callerInfo.name} → ${targetUser.display_name} (${callType})`)

    // Aqui você poderia integrar com WebSockets ou push notifications
    // Por enquanto, vamos usar polling no frontend

    return NextResponse.json({
      success: true,
      callId: newCall.id,
      message: 'Chamada iniciada',
      targetUser: {
        id: targetUser.id,
        name: targetUser.display_name,
        photo: targetUser.photo_url,
        username: targetUser.username
      }
    })
  } catch (error) {
    console.error('Erro ao iniciar chamada:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao iniciar chamada' },
      { status: 500 }
    )
  }
}

async function handleAnswerCall(callId: string, userId: string) {
  try {
    // Verificar se a chamada existe e o usuário é o receptor
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', callId)
      .eq('receiver_id', userId)
      .eq('status', 'ringing')
      .single()

    if (callError || !call) {
      return NextResponse.json(
        { success: false, error: 'Chamada não encontrada ou já foi respondida' },
        { status: 404 }
      )
    }

    // Atualizar status da chamada
    const { error: updateError } = await supabase
      .from('calls')
      .update({
        status: 'connected',
        answered_at: new Date().toISOString()
      })
      .eq('id', callId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Chamada aceita'
    })
  } catch (error) {
    console.error('Erro ao aceitar chamada:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao aceitar chamada' },
      { status: 500 }
    )
  }
}

async function handleDeclineCall(callId: string, userId: string) {
  try {
    // Verificar se a chamada existe e o usuário é o receptor
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', callId)
      .eq('receiver_id', userId)
      .eq('status', 'ringing')
      .single()

    if (callError || !call) {
      return NextResponse.json(
        { success: false, error: 'Chamada não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar status da chamada
    const { error: updateError } = await supabase
      .from('calls')
      .update({
        status: 'declined',
        ended_at: new Date().toISOString()
      })
      .eq('id', callId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Chamada recusada'
    })
  } catch (error) {
    console.error('Erro ao recusar chamada:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao recusar chamada' },
      { status: 500 }
    )
  }
}

async function handleEndCall(callId: string, userId: string) {
  try {
    // Verificar se a chamada existe e o usuário participa dela
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', callId)
      .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
      .in('status', ['ringing', 'connected'])
      .single()

    if (callError || !call) {
      return NextResponse.json(
        { success: false, error: 'Chamada não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar status da chamada
    const { error: updateError } = await supabase
      .from('calls')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', callId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Chamada finalizada'
    })
  } catch (error) {
    console.error('Erro ao finalizar chamada:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao finalizar chamada' },
      { status: 500 }
    )
  }
}

// GET - Verificar chamadas pendentes para o usuário
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Buscar chamadas pendentes para este usuário
    const { data: pendingCalls, error } = await supabase
      .from('calls')
      .select(`
        id,
        call_type,
        status,
        started_at,
        caller_info,
        profiles!calls_caller_id_fkey(
          id,
          display_name,
          photo_url,
          username
        )
      `)
      .eq('receiver_id', user.id)
      .eq('status', 'ringing')
      .order('started_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      pendingCalls: pendingCalls || []
    })
  } catch (error) {
    console.error('Erro ao buscar chamadas pendentes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar chamadas' },
      { status: 500 }
    )
  }
}
