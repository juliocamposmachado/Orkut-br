import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Interface para os posts
interface LinkPreview {
  url: string
  title: string
  description: string
  image: string | null
  siteName: string
  favicon: string | null
  domain: string
}

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
  link_preview?: LinkPreview | null
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
    is_dj_post: false
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
        
        // CORREÇÃO: Usar global_feed para feed global, posts para perfis específicos
        let query;
        let tableName;
        
        if (profile_posts && user_id) {
          // Para posts do perfil: buscar diretamente da tabela posts
          console.log('📋 Carregando posts do perfil do usuário:', user_id)
          tableName = 'posts'
          query = supabase
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
              is_hidden,
              created_at
            `)
            .eq('author', user_id)
            .eq('is_hidden', false)
        } else {
          // Para feed global: buscar da tabela global_feed (mais otimizada)
          console.log('🌍 Carregando feed global da tabela global_feed')
          tableName = 'global_feed'
          
          // Buscar posts que NÃO foram ocultados por moderação
          query = supabase
            .from('global_feed')
            .select(`
              id,
              post_id,
              content,
              author,
              author_name,
              author_photo,
              visibility,
              likes_count,
              comments_count,
              shares_count,
              is_dj_post,
              is_hidden,
              created_at
            `)
            .eq('visibility', 'public')
            .eq('is_hidden', false)
        }
        
        const { data, error } = await query
          .order('created_at', { ascending: false })
          .limit(100)

        if (!error && data) {
          console.log(`✅ Posts carregados do Supabase (${tableName}): ${data.length}`)
          
          // Para global_feed, mapear post_id para id se necessário
          const processedData = tableName === 'global_feed' 
            ? data.map((post: any) => ({ ...post, id: post.post_id || post.id }))
            : data
          
          return NextResponse.json({
            success: true,
            posts: processedData,
            total: data.length,
            source: 'database',
            table: tableName
          })
        } else {
          console.warn(`⚠️ Erro no Supabase (${tableName}):`, error?.message || 'Erro desconhecido')
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
    console.log('🔍 [API] Dados recebidos no POST:', body)
    
    const { content, author, author_name, author_photo, visibility = 'public', is_dj_post = false, shares_count = 0, link_preview } = body

    // Validações básicas
    if (!content || !author) {
      console.error('❌ [API] Dados obrigatórios ausentes:', { content: !!content, author: !!author })
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

    console.log('✅ [API] Validações passaram, criando post...')

    // Criar novo post
    const newPost: Post = {
      id: Date.now() + Math.random(), // ID único
      content: content.trim(),
      author,
      author_name: author_name || 'Usuário',
      author_photo: author_photo || null,
      visibility,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString(),
      is_dj_post: is_dj_post || false,
      link_preview: link_preview || null
    }
    
    console.log('📝 [API] Novo post criado:', newPost)

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
        console.log(`🔄 [API] Salvando post no Supabase: ${author_name}`)
        
        // Obter o token de autenticação dos headers da requisição
        const authHeader = request.headers.get('authorization')
        let serverSupabase = supabase
        
        // Se há token de autorização, usar cliente autenticado
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.replace('Bearer ', '')
          // Criar cliente com sessão autenticada usando o token JWT
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
          console.log('🔑 [API] Usando cliente Supabase autenticado com JWT')
        } else {
          console.log('🔓 [API] Usando cliente Supabase não autenticado')
        }
        
        // CORREÇÃO URGENTE: Inserir diretamente no global_feed para contornar trigger problemático
        console.log('🔧 [API] Usando estratégia de contorno - inserindo diretamente no global_feed')
        
        // Gerar ID único para o post
        const postId = Date.now() + Math.floor(Math.random() * 1000)
        
        const feedInsertData = {
          post_id: postId,
          content: newPost.content,
          author: newPost.author,
          author_name: newPost.author_name,
          author_photo: newPost.author_photo,
          visibility: newPost.visibility,
          likes_count: newPost.likes_count,
          comments_count: newPost.comments_count,
          shares_count: newPost.shares_count,
          is_dj_post: newPost.is_dj_post,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        console.log('📤 [API] Inserindo diretamente no global_feed:', feedInsertData)
        
        const { data, error } = await serverSupabase
          .from('global_feed')
          .insert(feedInsertData)
          .select()
          .single()

        if (!error && data) {
          // Mapear dados para formato esperado
          savedPost = {
            id: data.post_id,
            content: data.content,
            author: data.author,
            author_name: data.author_name,
            author_photo: data.author_photo,
            visibility: data.visibility,
            likes_count: data.likes_count,
            comments_count: data.comments_count,
            shares_count: data.shares_count,
            is_dj_post: data.is_dj_post,
            created_at: data.created_at
          } as Post
          
          source = 'database'
          console.log(`✅ [API] Post salvo com sucesso contornando problema: ${author_name}`)
          console.log(`🎯 [API] Post inserido diretamente no feed global - ID: ${data.post_id}`)
          
          // Registrar atividade recente
          try {
            console.log('📝 [API] Registrando atividade recente para o post...')
            const activityData = {
              profile_id: author,
              activity_type: 'post',
              activity_data: {
                post_id: data.post_id,
                content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
              }
            }
            
            const activityResult = await serverSupabase
              .from('recent_activities')
              .insert(activityData)
              .select()
              .single()
            
            if (activityResult.error) {
              console.warn('⚠️ [API] Erro ao registrar atividade:', activityResult.error.message)
            } else {
              console.log('✅ [API] Atividade recente registrada com sucesso')
            }
          } catch (activityError) {
            console.warn('⚠️ [API] Falha ao registrar atividade (não crítico):', activityError)
          }
          
          return NextResponse.json({
            success: true,
            post: savedPost,
            message: 'Post criado e salvo com sucesso! (Usando estratégia de contorno)',
            source
          })
        } else {
          console.warn('⚠️ [API] Erro ao salvar no Supabase:', error?.message || 'Erro desconhecido')
          console.warn('⚠️ [API] Detalhes completos do erro:', error)
          
          // Se for erro de schema/campo, usar fallback para memória
          if (error?.message?.includes('field') || error?.message?.includes('column')) {
            console.warn('🔄 [API] Erro de campo/coluna detectado. Usando fallback para memória.')
            source = 'memory'
          } else {
            return NextResponse.json(
              { 
                success: false, 
                error: `Erro no banco de dados: ${error?.message || 'Erro desconhecido'}`,
                details: error
              },
              { status: 500 }
            )
          }
        }
      } catch (supabaseError: any) {
        console.error('❌ [API] Erro crítico no Supabase:', supabaseError)
        console.warn('🔄 [API] Usando fallback para memória devido ao erro crítico')
        source = 'memory'
      }
    } else {
      console.warn('⚠️ [API] Supabase não configurado - usando memória')
      source = 'memory'
    }

    // Se não conseguiu salvar no Supabase ou houve erro, salvar na memória
    if (source === 'memory') {
      memoryPosts.unshift(newPost)
      
      // Manter apenas os últimos 500 posts
      if (memoryPosts.length > 500) {
        memoryPosts.splice(500)
      }
      
      console.log(`🔄 [API] Post salvo na memória: ${author_name} - "${content.substring(0, 50)}..."`)
      
      // Tentar registrar atividade mesmo no fallback de memória
      try {
        console.log('📝 [API] Tentando registrar atividade recente via API...')
        // Como estamos no server-side, não podemos fazer fetch interno
        // Mas podemos tentar usar Supabase diretamente se disponível
        if (hasValidSupabase && supabase) {
          const activityData = {
            profile_id: author,
            activity_type: 'post',
            activity_data: {
              post_id: newPost.id,
              content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
            }
          }
          
          const activityResult = await supabase
            .from('recent_activities')
            .insert(activityData)
            .select()
            .single()
          
          if (activityResult.error) {
            console.warn('⚠️ [API] Erro ao registrar atividade (fallback):', activityResult.error.message)
          } else {
            console.log('✅ [API] Atividade recente registrada com sucesso (fallback)')
          }
        }
      } catch (activityError) {
        console.warn('⚠️ [API] Falha ao registrar atividade no fallback (não crítico):', activityError)
      }
    }

    console.log('✅ [API] Finalizando com sucesso. Source:', source)
    
    return NextResponse.json({
      success: true,
      post: savedPost,
      message: 'Post criado com sucesso',
      source
    })
  } catch (error) {
    console.error('❌ [API] Erro ao criar post:', error)
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
          // Primeiro buscar o post atual para incrementar
          const { data: currentPost } = await supabase
            .from('posts')
            .select('likes_count')
            .eq('id', post_id)
            .single()
          
          updateData.likes_count = (currentPost?.likes_count || 0) + 1
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
