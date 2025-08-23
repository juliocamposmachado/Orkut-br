import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

// GET - Buscar todos os posts
export async function GET(request: NextRequest) {
  try {
    // Verificar se Supabase está configurado corretamente
    const hasValidSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (hasValidSupabase && supabase) {
      try {
        console.log('🔄 Tentando carregar posts do Supabase...')
        
        // Tentar buscar do Supabase primeiro
        const { data, error } = await supabase
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
            created_at,
            is_dj_post
          `)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(100)

        if (!error && data) {
          console.log(`✅ Posts carregados do Supabase: ${data.length}`)
          
          // Adicionar shares_count aos posts do Supabase (compatibilidade)
          const postsWithShares = data.map(post => ({ ...post, shares_count: 0 }))
          
          return NextResponse.json({
            success: true,
            posts: postsWithShares,
            total: postsWithShares.length,
            source: 'database'
          })
        } else {
          console.warn('⚠️ Erro no Supabase:', error?.message || 'Erro desconhecido')
          console.warn('⚠️ Código do erro:', error?.code)
          throw new Error(`Supabase: ${error?.message || 'Erro desconhecido'}`)
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase falhou, usando fallback para memória:', supabaseError)
      }
    } else {
      console.warn('⚠️ Supabase não configurado corretamente, usando memória')
    }

    // Fallback para memória
    const sortedPosts = [...memoryPosts].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    console.log(`🔄 Posts carregados da memória: ${sortedPosts.length}`)
    
    return NextResponse.json({
      success: true,
      posts: sortedPosts.slice(0, 100),
      total: sortedPosts.length,
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
  const { content, author, author_name, author_photo, visibility = 'public', is_dj_post = false, shares_count = 0 } = body

    // Validações básicas
    if (!content || !author || !author_name) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios não fornecidos' },
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
      author,
      author_name,
      author_photo: author_photo || null,
      visibility,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString(),
      is_dj_post
    }

    let savedPost = newPost
    let source = 'memory'

    // Verificar se Supabase está configurado corretamente
    const hasValidSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (hasValidSupabase && supabase) {
      // Tentar salvar no Supabase primeiro
      try {
        console.log(`🔄 Tentando salvar post no Supabase: ${author_name}`)
        
        const { data, error } = await supabase
          .from('posts')
          .insert({
            content: newPost.content,
            author: newPost.author,
            author_name: newPost.author_name,
            author_photo: newPost.author_photo,
            visibility: newPost.visibility,
            likes_count: newPost.likes_count,
            comments_count: newPost.comments_count,
            is_dj_post: newPost.is_dj_post
          })
          .select()
          .single()

        if (!error && data) {
          savedPost = { ...data, shares_count: 0 } as Post // Adicionar shares_count para compatibilidade
          source = 'database'
          console.log(`✅ Post salvo no Supabase: ${author_name} - "${content.substring(0, 50)}..."`)
        } else {
          console.warn('⚠️ Erro ao salvar no Supabase:', error?.message || 'Erro desconhecido')
          console.warn('⚠️ Código do erro:', error?.code)
          throw new Error(`Supabase: ${error?.message || 'Erro desconhecido'}`)
        }
      } catch (supabaseError) {
        console.warn('⚠️ Fallback para memória devido erro Supabase:', supabaseError)
      }
    } else {
      console.warn('⚠️ Supabase não configurado, salvando em memória')
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
