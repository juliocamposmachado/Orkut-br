import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Buscar usuários que têm email @gmail.com (que usaram Google Auth)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, photo_url, email, created_at')
      .like('email', '%@gmail.com')
      .order('created_at', { ascending: false })
      .limit(20) // Limitar a 20 usuários

    if (error) {
      console.error('Erro ao buscar usuários Gmail:', error)
      return NextResponse.json({ error: 'Erro ao buscar usuários Gmail' }, { status: 500 })
    }

    // Simular status online/offline aleatoriamente para demo
    const usersWithStatus = profiles?.map(profile => ({
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      photo_url: profile.photo_url,
      email: profile.email,
      status: Math.random() > 0.7 ? 'online' : 'offline', // 30% chance de estar online
      activity: Math.random() > 0.5 ? 
        ['Navegando no Orkut', 'Ouvindo música', 'Estudando programação', 'Em uma chamada', 'Postando fotos'][Math.floor(Math.random() * 5)] :
        null,
      lastSeen: Math.random() > 0.5 ? 
        ['Há alguns minutos', 'Há 1 hora', 'Há 2 horas', 'Há 1 dia'][Math.floor(Math.random() * 4)] :
        null,
      created_at: profile.created_at
    })) || []

    return NextResponse.json({
      users: usersWithStatus,
      total: profiles?.length || 0,
      online: usersWithStatus.filter(u => u.status === 'online').length
    })

  } catch (error) {
    console.error('Erro na API de usuários Gmail:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
