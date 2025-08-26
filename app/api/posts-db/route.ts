import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Interface para os posts
interface Post {
  id: number | string
  content: string
  author: string
  author_name: string
  author_photo: string | null
  visibility: 'public' | 'friends'
  likes_count: number
  comments_count: number
  created_at: string
  is_dj_post?: boolean
  shares_count?: number
  // Campos do avatar personalizado
  avatar_id?: string | null
  avatar_emoji?: string | null
  avatar_name?: string | null
}

// Dados em memória como fallback (para desenvolvimento)
let memoryPosts: Post[] = [
  {
    id: Date.now() - 1000,
    content: "🎉 Bem-vindos ao sistema de feed global! Agora todos podem ver as postagens uns dos outros! 🌍✨",
    author: "system",
    author_name: "Sistema Orkut",
    author_photo: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=150&h=150&fit=crop&crop=face",
    visibility: "public",
    likes_count: 25,
    comments_count: 8,
    shares_count: 12,
    created_at: new Date(Date.now() - 1000).toISOString(),
    is_dj_post: false,
    // Exemplo com avatar
    avatar_id: null,
    avatar_emoji: null,
    avatar_name: null
  },
  {
    id: Date.now() - 2000,
    content: "Testando o novo sistema de avatars! 🎭 Que nostalgia dos anos 2000! 💫",
    author: "demo-user",
    author_name: "Usuário Demo",
    author_photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    visibility: "public",
    likes_count: 12,
    comments_count: 3,
    shares_count: 2,
    created_at: new Date(Date.now() - 2000).toISOString(),
    is_dj_post: false,
    // Avatar exemplo
    avatar_id: "cool-guy",
    avatar_emoji: "😎",
    avatar_name: "Cara Legal"
  }
]

// GET - Buscar posts (feed global ou por usuário)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const user_id = url.searchParams.get('user_id')
    const profile_posts = url.searchParams.get('profile_posts') // Para posts do perfil
    
    console.log('🔄 Carregando posts:', { user_id, profile_posts })
    
    // Verificar se Supabase está configurado corretamente
    const hasValidSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (hasValidSupabase && supabase) {
      try {
        console.log('🔄 Carregando posts do Supabase...')
        
        let query = supabase
          .from('posts')
          .select(`
            id,
            content,
            author,
            author_name,
            author_photo,
            visibility,
            likes_count,
            comments_count,
            shares_count,
            is_dj_post,
            avatar_id,
            avatar_emoji,
            avatar_name,
            created_at
          `)
        
        // Se for para carregar posts do perfil de um usuário específico
        if (profile_posts && user_id) {
          query = query.eq('author', user_id)
        }
        
        const { data, error } = await query
          .order('created_at', { ascending: false })
          .limit(100)

        if (!error && data) {
          console.log(`✅ Posts carregados do Supabase: ${data.length}`)
          
          return NextResponse.json({
            success: true,
            posts: data,
            total: data.length,
            source: 'database'
          })
        } else {
          console.warn('⚠️ Erro no Supabase:', error?.message || 'Erro desconhecido')
          throw new Error(`Supabase: ${error?.message || 'Erro desconhecido'}`)
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase falhou, usando fallback para memória:', supabaseError)
      }
    } else {
      console.warn('⚠️ Supabase não configurado corretamente, usando memória')
    }

    // Fallback para memória (apenas para desenvolvimento)
    const sortedPosts = [...memoryPosts].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Filtrar posts do usuário se solicitado
    const filteredPosts = profile_posts && user_id 
      ? sortedPosts.filter(post => post.author === user_id)
      : sortedPosts

    console.log(`🔄 Posts carregados da memória: ${filteredPosts.length}`)
    
    return NextResponse.json({
      success: true,
      posts: filteredPosts.slice(0, 100),
      total: filteredPosts.length,
      source: 'memory'
    })
  } catch (error) {
    console.error('❌ Erro ao carregar posts:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar posts' },
      { status: 500 }
    )
  }
}

// POST - Criar novo post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 Dados recebidos:', body)
    
    const { 
      content, 
      author, 
      author_name, 
      author_photo, 
      visibility = 'public', 
      is_dj_post = false, 
      shares_count = 0,
      // Novos campos do avatar
      avatar_id = null,
      avatar_emoji = null,
      avatar_name = null
    } = body

    // Validações básicas
    if (!content || !author) {
      console.error('❌ Dados obrigatórios ausentes:', { content: !!content, author: !!author })
      return NextResponse.json(
        { success: false, error: 'Conteúdo e autor são obrigatórios' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Conteúdo muito longo (máximo 500 caracteres)' },
        { status: 400 }
      )
    }

    // Criar novo post
    const newPost: Post = {
      id: Date.now() + Math.random(), // ID único
      content: content.trim(),
      author: author || 'unknown',
      author_name: author_name || 'Usuário Anônimo',
      author_photo: author_photo || null,
      visibility,
      likes_count: 0,
      comments_count: 0,
      shares_count: shares_count || 0,
      created_at: new Date().toISOString(),
      is_dj_post: is_dj_post || false,
      // Campos do avatar personalizado
      avatar_id: avatar_id || null,
      avatar_emoji: avatar_emoji || null,
      avatar_name: avatar_name || null
    }
    
    console.log('📝 Post criado:', newPost)

    let savedPost = newPost
    let source = 'memory'

    // Verificar se Supabase está configurado corretamente
    const hasValidSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('🔍 Status Supabase:', {
      hasValidConfig: hasValidSupabase,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configurada' : 'não configurada',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configurada' : 'não configurada'
    })

    if (hasValidSupabase && supabase) {
      // Tentar salvar no Supabase primeiro
      try {
        console.log(`🔄 Salvando post no Supabase: ${author_name || 'Usuário'}`)
        
        // Usar service_role se disponível para bypass RLS, senão usar cliente com auth
        let serverSupabase = supabase
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        if (serviceKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          // Usar service_role para bypass RLS (desenvolvimento)
          serverSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            serviceKey
          )
          console.log('🔑 Usando service_role_key para bypass RLS')
        } else {
          // Tentar usar token de autenticação
          const authHeader = request.headers.get('authorization')
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '')
            serverSupabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              {
                global: {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              }
            )
            console.log('🔒 Usando cliente Supabase autenticado com JWT')
          } else {
            console.log('🔓 Usando cliente Supabase padrão')
          }
        }
        
        // Preparar dados para inserção conforme schema da tabela posts
        const insertData = {
          content: newPost.content,
          author: newPost.author, // UUID referenciando profiles(id)
          author_name: newPost.author_name || 'Usuário',
          author_photo: newPost.author_photo,
          photo_url: Array.isArray(body.image_urls) && body.image_urls.length > 0 ? body.image_urls[0] : null, // Usar primeira imagem como photo_url
          visibility: newPost.visibility,
          likes_count: newPost.likes_count || 0,
          comments_count: newPost.comments_count || 0,
          shares_count: newPost.shares_count || 0,
          is_dj_post: newPost.is_dj_post || false,
          // Campos do avatar personalizado
          avatar_id: newPost.avatar_id,
          avatar_emoji: newPost.avatar_emoji,
          avatar_name: newPost.avatar_name
        }
        
        console.log('📤 Enviando para Supabase:', insertData)
        
        const { data, error } = await serverSupabase
          .from('posts')
          .insert(insertData)
          .select()
          .single()

        if (!error && data) {
          savedPost = data as Post
          source = 'database'
          console.log(`✅ Post permanentemente salvo no banco: ${author_name}`)
          
          // Criar atividade recente para o usuário
          try {
            const activityResponse = await fetch('/api/recent-activities', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(request.headers.get('authorization') ? {
                  'Authorization': request.headers.get('authorization')!
                } : {})
              },
              body: JSON.stringify({
                profile_id: author,
                activity_type: 'post',
                activity_data: {
                  post_id: data.id,
                  content: content.trim().substring(0, 100) + (content.length > 100 ? '...' : ''),
                  post_content: content.trim()
                }
              })
            })
            
            if (activityResponse.ok) {
              console.log('✅ Atividade recente criada para o post')
            } else {
              console.warn('⚠️ Erro ao criar atividade recente:', await activityResponse.text())
            }
          } catch (activityError) {
            console.warn('⚠️ Erro ao criar atividade recente:', activityError)
          }
          
          return NextResponse.json({
            success: true,
            post: savedPost,
            message: 'Post criado e salvo permanentemente',
            source
          })
        } else {
          console.warn('⚠️ Erro ao salvar no Supabase:', error?.message || 'Erro desconhecido')
          console.warn('⚠️ Detalhes completos:', error)
          return NextResponse.json(
            { 
              success: false, 
              error: `Erro no banco de dados: ${error?.message || 'Erro desconhecido'}`,
              details: error
            },
            { status: 500 }
          )
        }
      } catch (supabaseError: any) {
        console.error('❌ Erro crítico no Supabase:', supabaseError)
        return NextResponse.json(
          { 
            success: false, 
            error: `Erro crítico no banco: ${supabaseError.message || 'Erro desconhecido'}`,
            details: supabaseError
          },
          { status: 500 }
        )
      }
    } else {
      console.warn('⚠️ Supabase não configurado - verifique as variáveis de ambiente')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Configuração do banco de dados não encontrada. Verifique as variáveis de ambiente.' 
        },
        { status: 500 }
      )
    }

    // Se não conseguiu salvar no Supabase, salvar na memória
    if (source === 'memory') {
      memoryPosts.unshift(newPost)
      
      // Manter apenas os últimos 500 posts
      if (memoryPosts.length > 500) {
        memoryPosts.splice(500)
      }
      
      console.log(`🔄 Post salvo na memória: ${author_name} - "${content.substring(0, 50)}..."`)
    }

    return NextResponse.json({
      success: true,
      post: savedPost,
      message: 'Post criado com sucesso',
      source
    })
  } catch (error) {
    console.error('❌ Erro ao criar post:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar post' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar post (curtidas, etc)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { post_id, action, user_id } = body

    if (!post_id || !action || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    if (supabase) {
      // Tentar atualizar no Supabase
      try {
        let updateData: any = {}
        
        if (action === 'like') {
          // Primeiro buscar o post atual para incrementar e obter dados do autor
          const { data: currentPost } = await supabase
            .from('posts')
            .select('likes_count, author, author_name, content')
            .eq('id', post_id)
            .single()
          
          updateData.likes_count = (currentPost?.likes_count || 0) + 1

          // Criar notificação para o autor do post se não for ele mesmo curtindo
          if (currentPost && currentPost.author !== user_id) {
            try {
              // Buscar dados do usuário que curtiu
              const { data: userProfile } = await supabase
                .from('profiles')
                .select('display_name, photo_url, username')
                .eq('id', user_id)
                .single()

              if (userProfile) {
                const notificationData = {
                  profile_id: currentPost.author,
                  type: 'like',
                  payload: {
                    from_user: {
                      id: user_id,
                      display_name: userProfile.display_name || userProfile.username || '',
                      photo_url: userProfile.photo_url,
                      username: userProfile.username || ''
                    },
                    post: {
                      id: post_id,
                      content: currentPost.content || ''
                    },
                    action_url: `/post/${post_id}`
                  },
                  read: false
                }

                // Tentar inserir notificação no banco
                const { error: notificationError } = await supabase
                  .from('notifications')
                  .insert(notificationData)
                  
                if (notificationError) {
                  console.warn('Failed to create like notification in database:', notificationError)
                  // Fallback: add to local storage for the target user
                  const existingNotifications = JSON.parse(
                    (typeof localStorage !== 'undefined' ? localStorage.getItem(`notifications_${currentPost.author}`) : null) || '[]'
                  )
                  
                  const localNotification = {
                    id: Date.now().toString(),
                    type: 'like',
                    title: 'Curtiu seu post',
                    message: 'curtiu seu post',
                    read: false,
                    created_at: new Date().toISOString(),
                    from_user: notificationData.payload.from_user,
                    post: notificationData.payload.post
                  }
                  
                  const updatedNotifications = [localNotification, ...existingNotifications].slice(0, 50)
                  if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(`notifications_${currentPost.author}`, JSON.stringify(updatedNotifications))
                  }
                } else {
                  console.log('✅ Like notification created successfully')
                }
              }
            } catch (notificationError) {
              console.warn('Error creating like notification:', notificationError)
            }
          }
        } else if (action === 'comment') {
          const { data: currentPost } = await supabase
            .from('posts')
            .select('comments_count')
            .eq('id', post_id)
            .single()
          
          updateData.comments_count = (currentPost?.comments_count || 0) + 1
        }

        const { data, error } = await supabase
          .from('posts')
          .update(updateData)
          .eq('id', post_id)
          .select()
          .single()

        if (!error && data) {
          return NextResponse.json({
            success: true,
            post: data,
            message: 'Post atualizado com sucesso',
            source: 'database'
          })
        } else {
          console.warn('⚠️ Erro ao atualizar no Supabase:', error?.message)
        }
      } catch (supabaseError) {
        console.warn('⚠️ Erro no Supabase, tentando memória:', supabaseError)
      }
    }

    // Fallback para memória
    const postIndex = memoryPosts.findIndex(p => p.id == post_id)
    
    if (postIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Post não encontrado' },
        { status: 404 }
      )
    }

    // Aplicar ação
    if (action === 'like') {
      memoryPosts[postIndex].likes_count += 1
    } else if (action === 'comment') {
      memoryPosts[postIndex].comments_count += 1
    }

    return NextResponse.json({
      success: true,
      post: memoryPosts[postIndex],
      message: 'Post atualizado com sucesso',
      source: 'memory'
    })
  } catch (error) {
    console.error('❌ Erro ao atualizar post:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar post' },
      { status: 500 }
    )
  }
}
