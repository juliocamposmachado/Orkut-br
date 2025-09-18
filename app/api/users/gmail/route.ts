import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Criar dados demo de usuários Gmail para evitar erros
    const demoGmailUsers = [
      {
        id: 'demo_gmail_1',
        username: 'ana.silva',
        display_name: 'Ana Silva',
        photo_url: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=100',
        email: 'ana.silva@gmail.com',
        status: 'online',
        activity: 'Navegando no Orkut',
        lastSeen: null,
        created_at: new Date().toISOString()
      },
      {
        id: 'demo_gmail_2',
        username: 'carlos.santos',
        display_name: 'Carlos Santos',
        photo_url: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=100',
        email: 'carlos.santos@gmail.com',
        status: 'online',
        activity: 'Ouvindo música',
        lastSeen: null,
        created_at: new Date().toISOString()
      },
      {
        id: 'demo_gmail_3',
        username: 'maria.costa',
        display_name: 'Maria Costa',
        photo_url: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100',
        email: 'maria.costa@gmail.com',
        status: 'offline',
        activity: null,
        lastSeen: 'Há 30 minutos',
        created_at: new Date().toISOString()
      },
      {
        id: 'demo_gmail_4',
        username: 'pedro.oliveira',
        display_name: 'Pedro Oliveira',
        photo_url: 'https://images.pexels.com/photos/1121796/pexels-photo-1121796.jpeg?auto=compress&cs=tinysrgb&w=100',
        email: 'pedro.oliveira@gmail.com',
        status: 'online',
        activity: 'Em uma chamada',
        lastSeen: null,
        created_at: new Date().toISOString()
      }
    ]

    // Tentar buscar dados reais, mas usar demo em caso de erro
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, photo_url, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (!error && profiles && profiles.length > 0) {
        // Se temos dados reais, simular status Gmail
        const realUsersWithGmailStatus = profiles.slice(0, 4).map((profile, index) => ({
          ...profile,
          email: `${profile.username || `user${index + 1}`}@gmail.com`,
          status: Math.random() > 0.6 ? 'online' : 'offline',
          activity: Math.random() > 0.5 ? 
            ['Navegando no Orkut', 'Ouvindo música', 'Estudando', 'Em uma chamada'][Math.floor(Math.random() * 4)] :
            null,
          lastSeen: Math.random() > 0.5 ? 
            ['Há alguns minutos', 'Há 1 hora', 'Há 2 horas'][Math.floor(Math.random() * 3)] :
            null
        }))

        return NextResponse.json({
          users: realUsersWithGmailStatus,
          total: realUsersWithGmailStatus.length,
          online: realUsersWithGmailStatus.filter(u => u.status === 'online').length
        })
      }
    } catch (dbError) {
      console.log('Usando dados demo para usuários Gmail:', dbError)
    }

    // Usar dados demo se não há dados reais
    return NextResponse.json({
      users: demoGmailUsers,
      total: demoGmailUsers.length,
      online: demoGmailUsers.filter(u => u.status === 'online').length
    })

  } catch (error) {
    console.error('Erro na API de usuários Gmail:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
