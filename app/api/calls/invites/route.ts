import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente estão disponíveis
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Função para criar cliente Supabase com verificações
function createSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase não está configurado corretamente')
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verificar se Supabase está configurado
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Service not configured' 
      }, { status: 503 });
    }

    const supabase = createSupabaseClient();
    const body = await request.json();
    const { roomId, invitedUserId, inviterUserId, callType, message } = body;

    if (!roomId || !invitedUserId || !inviterUserId) {
      return NextResponse.json({ 
        error: 'Room ID, invited user ID, and inviter user ID are required' 
      }, { status: 400 });
    }

    // Verificar se o usuário convidado existe e está disponível
    const { data: invitedUser, error: userError } = await supabase
      .from('profiles')
      .select('id, display_name, call_availability, is_online')
      .eq('id', invitedUserId)
      .single();

    if (userError || !invitedUser) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Verificar se o usuário está disponível para chamadas
    if (invitedUser.call_availability === 'unavailable') {
      return NextResponse.json({ 
        error: 'User is not available for calls',
        userStatus: 'unavailable'
      }, { status: 409 });
    }

    // Verificar se já existe um convite pendente para este usuário na mesma sala
    const { data: existingInvite } = await supabase
      .from('call_invites')
      .select('id')
      .eq('room_id', roomId)
      .eq('invited_user_id', invitedUserId)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json({ 
        error: 'Invite already sent to this user',
        inviteStatus: 'already_sent'
      }, { status: 409 });
    }

    // Buscar dados do usuário que está convidando
    const { data: inviter } = await supabase
      .from('profiles')
      .select('display_name, photo_url')
      .eq('id', inviterUserId)
      .single();

    // Criar o convite
    const { data: invite, error: inviteError } = await supabase
      .from('call_invites')
      .insert({
        room_id: roomId,
        invited_user_id: invitedUserId,
        inviter_user_id: inviterUserId,
        call_type: callType || 'individual',
        message: message || `${inviter?.display_name || 'Alguém'} convidou você para uma chamada`,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Erro ao criar convite:', inviteError);
      return NextResponse.json({ 
        error: 'Failed to create invite' 
      }, { status: 500 });
    }

    // Criar notificação em tempo real para o usuário convidado
    const { error: notificationError } = await supabase
      .from('call_notifications')
      .insert({
        user_id: invitedUserId,
        room_id: roomId,
        inviter_id: inviterUserId,
        inviter_name: inviter?.display_name || 'Usuário desconhecido',
        inviter_photo: inviter?.photo_url,
        call_type: callType || 'individual',
        message: message || `${inviter?.display_name || 'Alguém'} convidou você para uma chamada`,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error('Erro ao criar notificação:', notificationError);
    }

    return NextResponse.json({
      invite,
      invitedUser: {
        id: invitedUser.id,
        display_name: invitedUser.display_name,
        is_online: invitedUser.is_online
      }
    });

  } catch (error) {
    console.error('Erro na API de convites:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar se Supabase está configurado
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Service not configured' 
      }, { status: 503 });
    }

    const supabase = createSupabaseClient();
    const { searchParams } = request.nextUrl;
    const roomId = searchParams.get('roomId');
    const userId = searchParams.get('userId');

    if (!roomId && !userId) {
      return NextResponse.json({ 
        error: 'Room ID or User ID is required' 
      }, { status: 400 });
    }

    let query = supabase.from('call_invites').select(`
      id,
      room_id,
      invited_user_id,
      inviter_user_id,
      call_type,
      message,
      status,
      created_at,
      updated_at,
      invited_user:profiles!invited_user_id(id, display_name, photo_url, is_online),
      inviter_user:profiles!inviter_user_id(id, display_name, photo_url)
    `);

    if (roomId) {
      query = query.eq('room_id', roomId);
    }
    
    if (userId) {
      query = query.eq('invited_user_id', userId);
    }

    const { data: invites, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar convites:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch invites' 
      }, { status: 500 });
    }

    return NextResponse.json({ invites });

  } catch (error) {
    console.error('Erro na API de convites:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verificar se Supabase está configurado
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Service not configured' 
      }, { status: 503 });
    }

    const supabase = createSupabaseClient();
    const body = await request.json();
    const { inviteId, status, userId } = body;

    if (!inviteId || !status || !userId) {
      return NextResponse.json({ 
        error: 'Invite ID, status, and user ID are required' 
      }, { status: 400 });
    }

    if (!['accepted', 'declined'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status' 
      }, { status: 400 });
    }

    // Atualizar o convite
    const { data: invite, error: updateError } = await supabase
      .from('call_invites')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', inviteId)
      .eq('invited_user_id', userId)
      .select()
      .single();

    if (updateError || !invite) {
      return NextResponse.json({ 
        error: 'Failed to update invite or invite not found' 
      }, { status: 404 });
    }

    // Atualizar notificação correspondente
    await supabase
      .from('call_notifications')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('room_id', invite.room_id)
      .eq('user_id', userId);

    return NextResponse.json({ invite });

  } catch (error) {
    console.error('Erro ao atualizar convite:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
