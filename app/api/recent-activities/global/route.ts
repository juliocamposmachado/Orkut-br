import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface ActivityData {
  post_id?: number
  content?: string
  post_content?: string
  friend_id?: string
  friend_name?: string
  community_id?: string
  community_name?: string
  photo_url?: string
  old_value?: string
  new_value?: string
}

interface RecentActivity {
  id: string
  profile_id: string
  activity_type: 'post' | 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'community_joined' | 'photo_added' | 'profile_updated' | 'user_joined'
  activity_data: ActivityData
  created_at: string
  profile?: {
    id: string
    display_name: string
    username: string
    photo_url: string
  }
}

// GET - Buscar atividades recentes globais (de todos os usuários)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log(`🔄 Carregando atividades globais da comunidade (limit: ${limit})`)

    // Verificar se Supabase está configurado
    const hasValidSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (hasValidSupabase && supabase) {
      try {
        // Usar service_role se disponível para bypass RLS
        let serverSupabase = supabase
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        if (serviceKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          serverSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            serviceKey
          )
          console.log('🔑 Usando service_role_key para atividades globais')
        }

        // Buscar atividades reais a partir de diferentes fontes
        const realActivities: RecentActivity[] = []

        // 1. Buscar novos usuários (recém-cadastrados)
        try {
          const { data: newUsers, error: usersError } = await serverSupabase
            .from('profiles')
            .select('id, display_name, username, photo_url, created_at')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24h
            .order('created_at', { ascending: false })
            .limit(10)

          if (!usersError && newUsers) {
            newUsers.forEach(user => {
              realActivities.push({
                id: `user_joined_${user.id}`,
                profile_id: user.id,
                activity_type: 'user_joined',
                activity_data: {},
                created_at: user.created_at,
                profile: {
                  id: user.id,
                  display_name: user.display_name,
                  username: user.username,
                  photo_url: user.photo_url
                }
              })
            })
            console.log(`✅ ${newUsers.length} novos usuários encontrados`)
          }
        } catch (userError) {
          console.warn('⚠️ Erro ao buscar novos usuários:', userError)
        }

        // 2. Buscar posts recentes (posts reais do sistema)
        try {
          const { data: recentPosts, error: postsError } = await serverSupabase
            .from('posts')
            .select('id, content, author, author_name, author_photo, created_at')
            .eq('visibility', 'public')
            .eq('is_hidden', false)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24h
            .order('created_at', { ascending: false })
            .limit(15)

          if (!postsError && recentPosts) {
            // Buscar dados dos autores dos posts
            const authorIds = Array.from(new Set(recentPosts.map(post => post.author)))
            const { data: authors } = await serverSupabase
              .from('profiles')
              .select('id, display_name, username, photo_url')
              .in('id', authorIds)

            const authorsMap = new Map(authors?.map(author => [author.id, author]) || [])

            recentPosts.forEach(post => {
              const author = authorsMap.get(post.author)
              realActivities.push({
                id: `post_${post.id}`,
                profile_id: post.author,
                activity_type: 'post',
                activity_data: {
                  post_id: post.id,
                  content: post.content
                },
                created_at: post.created_at,
                profile: author ? {
                  id: author.id,
                  display_name: author.display_name,
                  username: author.username,
                  photo_url: author.photo_url
                } : {
                  id: post.author,
                  display_name: post.author_name || 'Usuário',
                  username: post.author,
                  photo_url: post.author_photo || ''
                }
              })
            })
            console.log(`✅ ${recentPosts.length} posts recentes encontrados`)
          }
        } catch (postsError) {
          console.warn('⚠️ Erro ao buscar posts recentes:', postsError)
        }

        // 3. Buscar amizades recentes (dados reais)
        try {
          const { data: recentFriendships, error: friendshipsError } = await serverSupabase
            .from('friendships')
            .select(`
              id,
              status,
              created_at,
              requester_id,
              addressee_id
            `)
            .eq('status', 'accepted')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24h
            .order('created_at', { ascending: false })
            .limit(5)

          if (!friendshipsError && recentFriendships && recentFriendships.length > 0) {
            // Buscar dados dos perfis envolvidos
            const profileIds = Array.from(new Set([
              ...recentFriendships.map(f => f.requester_id),
              ...recentFriendships.map(f => f.addressee_id)
            ]))
            
            const { data: friendshipProfiles } = await serverSupabase
              .from('profiles')
              .select('id, display_name, username, photo_url')
              .in('id', profileIds)
            
            const profilesMap = new Map(friendshipProfiles?.map(profile => [profile.id, profile]) || [])
            
            recentFriendships.forEach(friendship => {
              const requester = profilesMap.get(friendship.requester_id)
              const addressee = profilesMap.get(friendship.addressee_id)
              
              if (requester && addressee) {
                realActivities.push({
                  id: `friendship_${friendship.id}`,
                  profile_id: friendship.requester_id,
                  activity_type: 'friend_accepted',
                  activity_data: {
                    friend_id: friendship.addressee_id,
                    friend_name: addressee.display_name
                  },
                  created_at: friendship.created_at,
                  profile: {
                    id: requester.id,
                    display_name: requester.display_name,
                    username: requester.username,
                    photo_url: requester.photo_url
                  }
                })
              }
            })
            console.log(`✅ ${recentFriendships.length} amizades recentes encontradas`)
          }
        } catch (friendshipsError) {
          console.warn('⚠️ Erro ao buscar amizades recentes:', friendshipsError)
        }

        // 4. Buscar memberships recentes de comunidades (dados reais) - Simplificado
        try {
          const { data: recentMemberships, error: membershipsError } = await serverSupabase
            .from('community_members')
            .select('id, created_at, profile_id, community_id')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24h
            .order('created_at', { ascending: false })
            .limit(5)

          if (!membershipsError && recentMemberships && recentMemberships.length > 0) {
            // Buscar dados dos perfis e comunidades separadamente
            const memberProfileIds = Array.from(new Set(recentMemberships.map(m => m.profile_id)))
            const communityIds = Array.from(new Set(recentMemberships.map(m => m.community_id)))
            
            const { data: memberProfiles } = await serverSupabase
              .from('profiles')
              .select('id, display_name, username, photo_url')
              .in('id', memberProfileIds)
            
            const { data: communities } = await serverSupabase
              .from('communities')
              .select('id, name')
              .in('id', communityIds)
            
            const membersMap = new Map(memberProfiles?.map(profile => [profile.id, profile]) || [])
            const communitiesMap = new Map(communities?.map(community => [community.id, community]) || [])
            
            recentMemberships.forEach(membership => {
              const member = membersMap.get(membership.profile_id)
              const community = communitiesMap.get(membership.community_id)
              
              if (member && community) {
                realActivities.push({
                  id: `community_joined_${membership.id}`,
                  profile_id: membership.profile_id,
                  activity_type: 'community_joined',
                  activity_data: {
                    community_id: membership.community_id,
                    community_name: community.name || 'Comunidade'
                  },
                  created_at: membership.created_at,
                  profile: {
                    id: member.id,
                    display_name: member.display_name,
                    username: member.username,
                    photo_url: member.photo_url
                  }
                })
              }
            })
            console.log(`✅ ${recentMemberships.length} entradas em comunidades encontradas`)
          }
        } catch (membershipsError) {
          console.warn('⚠️ Erro ao buscar memberships de comunidades:', membershipsError)
        }

        // 5. Buscar atividades da tabela recent_activities se existir
        try {
          const { data: storedActivities, error: activitiesError } = await serverSupabase
            .from('recent_activities')
            .select(`
              *,
              profiles:profile_id (
                id,
                display_name,
                username,
                photo_url
              )
            `)
            .order('created_at', { ascending: false })
            .limit(10)

          if (!activitiesError && storedActivities) {
            storedActivities.forEach(activity => {
              realActivities.push({
                ...activity,
                profile: activity.profiles
              })
            })
            console.log(`✅ ${storedActivities.length} atividades armazenadas encontradas`)
          }
        } catch (activitiesError) {
          console.warn('⚠️ Erro ao buscar atividades armazenadas:', activitiesError)
        }

        // Se temos atividades reais, usá-las
        if (realActivities.length > 0) {
          // Ordenar por data mais recente e remover duplicatas
          const uniqueActivities = realActivities
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, limit)
          
          console.log(`✅ ${uniqueActivities.length} atividades reais carregadas`)
          
          return NextResponse.json({
            success: true,
            activities: uniqueActivities,
            total: uniqueActivities.length,
            source: 'real_data'
          })
        } else {
          console.log('📭 Nenhuma atividade real encontrada, usando demo')
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase falhou:', supabaseError)
      }
    }

    // Fallback: retornar atividades demo para desenvolvimento
    console.log('🔄 Usando fallback demo para atividades globais')
    
    const demoActivities: RecentActivity[] = [
      {
        id: 'demo1',
        profile_id: 'demo1',
        activity_type: 'user_joined',
        activity_data: {},
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        profile: {
          id: 'demo1',
          display_name: 'Ana Santos',
          username: 'ana_santos',
          photo_url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100'
        }
      },
      {
        id: 'demo2',
        profile_id: 'demo2',
        activity_type: 'post',
        activity_data: {
          content: 'Que nostalgia estar de volta no Orkut! 💜'
        },
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        profile: {
          id: 'demo2',
          display_name: 'Carlos Lima',
          username: 'carlos_lima',
          photo_url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100'
        }
      },
      {
        id: 'demo3',
        profile_id: 'demo3',
        activity_type: 'community_joined',
        activity_data: {
          community_name: 'Nostalgia dos Anos 2000'
        },
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        profile: {
          id: 'demo3',
          display_name: 'Mariana Costa',
          username: 'mariana_costa',
          photo_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100'
        }
      },
      {
        id: 'demo4',
        profile_id: 'demo4',
        activity_type: 'user_joined',
        activity_data: {},
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        profile: {
          id: 'demo4',
          display_name: 'Roberto Silva',
          username: 'roberto_silva',
          photo_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100'
        }
      },
      {
        id: 'demo5',
        profile_id: 'demo5',
        activity_type: 'post',
        activity_data: {
          content: 'Este novo Orkut está incrível! Melhor que o original! 🚀'
        },
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        profile: {
          id: 'demo5',
          display_name: 'Juliana Oliveira',
          username: 'juliana_oliveira',
          photo_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100'
        }
      },
      {
        id: 'demo6',
        profile_id: 'demo6',
        activity_type: 'community_joined',
        activity_data: {
          community_name: 'Gamers Retro'
        },
        created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        profile: {
          id: 'demo6',
          display_name: 'Pedro Alves',
          username: 'pedro_alves',
          photo_url: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=100'
        }
      }
    ]
    
    return NextResponse.json({
      success: true,
      activities: demoActivities,
      total: demoActivities.length,
      source: 'demo'
    })

  } catch (error) {
    console.error('❌ Erro ao carregar atividades globais:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar atividades da comunidade' },
      { status: 500 }
    )
  }
}
