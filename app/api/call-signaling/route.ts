import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * API de Sinalização WebRTC
 * Gerencia troca de mensagens entre peers (offers, answers, ICE candidates)
 */

export async function POST(request: NextRequest) {
  try {
    console.log('📡 API call-signaling POST iniciada')
    
    // Obter token de autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticação requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Erro de autenticação:', authError)
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { callId, targetUserId, message } = body
    
    console.log('📡 Sinalização recebida:', { callId, targetUserId, messageType: message.type })

    if (!callId || !targetUserId || !message) {
      return NextResponse.json(
        { error: 'callId, targetUserId e message são obrigatórios' },
        { status: 400 }
      )
    }

    // Salvar sinal no banco de dados
    const { data: signalData, error: signalError } = await supabase
      .from('call_signals')
      .insert({
        call_id: callId,
        from_user_id: user.id,
        to_user_id: targetUserId,
        signal_type: message.type,
        signal_data: message,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (signalError) {
      console.error('❌ Erro ao salvar sinal:', signalError)
      return NextResponse.json(
        { error: 'Erro ao processar sinalização' },
        { status: 500 }
      )
    }

    console.log('✅ Sinal salvo:', signalData)

    // Enviar via realtime para o destinatário
    try {
      const realtimeChannel = supabase.channel(`call_signaling_${targetUserId}`)
      
      await realtimeChannel.send({
        type: 'broadcast',
        event: 'webrtc_signaling',
        payload: {
          callId,
          fromUserId: user.id,
          message,
          timestamp: new Date().toISOString()
        }
      })
      
      console.log('📡 Sinalização enviada via realtime')
      
    } catch (realtimeError) {
      console.warn('⚠️ Erro no realtime:', realtimeError)
    }

    return NextResponse.json({
      success: true,
      message: 'Sinalização processada'
    })

  } catch (error) {
    console.error('❌ Erro na API call-signaling:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET - Buscar sinais pendentes para um usuário
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callId = searchParams.get('callId')
    const since = searchParams.get('since')

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticação requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    if (!callId) {
      return NextResponse.json(
        { error: 'callId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar sinais pendentes
    let query = supabase
      .from('call_signals')
      .select('*')
      .eq('call_id', callId)
      .eq('to_user_id', user.id)
      .order('created_at', { ascending: true })

    if (since) {
      query = query.gt('created_at', since)
    }

    const { data: signals, error: signalsError } = await query

    if (signalsError) {
      console.error('❌ Erro ao buscar sinais:', signalsError)
      return NextResponse.json(
        { error: 'Erro ao buscar sinalizações' },
        { status: 500 }
      )
    }

    console.log(`📡 Encontrados ${signals?.length || 0} sinais para usuário ${user.id}`)

    return NextResponse.json({
      success: true,
      signals: signals || []
    })

  } catch (error) {
    console.error('❌ Erro na API call-signaling GET:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
