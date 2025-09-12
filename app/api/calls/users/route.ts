import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const currentUserId = searchParams.get('userId');
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Buscar usuários online e disponíveis, excluindo o usuário atual
    let query = supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        photo_url,
        is_online,
        last_seen,
        call_availability
      `)
      .neq('id', currentUserId)
      .limit(limit);

    // Filtro de busca por nome
    if (search.trim()) {
      query = query.or(`display_name.ilike.%${search}%,username.ilike.%${search}%`);
    }

    // Ordenar por status online e última visualização
    query = query.order('is_online', { ascending: false })
                 .order('last_seen', { ascending: false });

    const { data: users, error } = await query;

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Buscar amizades do usuário atual para priorizar amigos
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', currentUserId)
      .eq('status', 'accepted');

    const friendIds = friendships?.map(f => f.friend_id) || [];

    // Separar amigos e não amigos
    const friends = users?.filter(user => friendIds.includes(user.id)) || [];
    const nonFriends = users?.filter(user => !friendIds.includes(user.id)) || [];

    // Priorizar amigos online
    const sortedUsers = [
      ...friends.filter(f => f.is_online),
      ...friends.filter(f => !f.is_online),
      ...nonFriends.filter(nf => nf.is_online),
      ...nonFriends.filter(nf => !nf.is_online)
    ];

    return NextResponse.json({
      users: sortedUsers,
      total: sortedUsers.length
    });

  } catch (error) {
    console.error('Erro na API de usuários:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
