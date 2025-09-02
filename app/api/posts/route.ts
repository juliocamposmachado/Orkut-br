import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Arquivo para armazenar posts globais
const POSTS_FILE = path.join(process.cwd(), 'data', 'global-posts.json')

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
}

// Função para garantir que a pasta data existe
async function ensureDataDir() {
  const dataDir = path.dirname(POSTS_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Função para carregar posts
async function loadPosts(): Promise<Post[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(POSTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // Se arquivo não existe, retorna array vazio
    return []
  }
}

// Função para salvar posts
async function savePosts(posts: Post[]) {
  await ensureDataDir()
  await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2))
}

// GET - Buscar todos os posts
export async function GET(request: NextRequest) {
  try {
    const posts = await loadPosts()
    
    // Ordenar por data (mais recente primeiro)
    posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    // Limitar a 100 posts mais recentes
    const recentPosts = posts.slice(0, 100)
    
    return NextResponse.json({
      success: true,
      posts: recentPosts,
      total: posts.length
    })
  } catch (error) {
    console.error('Erro ao carregar posts:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar posts' },
      { status: 500 }
    )
  }
}

// POST - Criar novo post
export async function POST(request: NextRequest) {
  try {
    // Add timeout for better error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    let body: any
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('Erro ao fazer parse do JSON:', jsonError)
      return NextResponse.json(
        { success: false, error: 'Dados inválidos fornecidos' },
        { status: 400 }
      )
    } finally {
      clearTimeout(timeoutId)
    }

    const { content, author, author_name, author_photo, visibility = 'public', is_dj_post = false } = body

    // Validações básicas
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Conteúdo é obrigatório' },
        { status: 400 }
      )
    }

    if (!author || typeof author !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Autor é obrigatório' },
        { status: 400 }
      )
    }

    if (!author_name || typeof author_name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Nome do autor é obrigatório' },
        { status: 400 }
      )
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Conteúdo não pode estar vazio' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Conteúdo muito longo (máximo 2000 caracteres)' },
        { status: 400 }
      )
    }

    // Carregar posts existentes com timeout
    let existingPosts: Post[]
    try {
      existingPosts = await Promise.race([
        loadPosts(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao carregar posts')), 5000)
        )
      ])
    } catch (loadError) {
      console.error('Erro ao carregar posts existentes:', loadError)
      // Se não conseguir carregar, começar com array vazio
      existingPosts = []
    }

    // Criar novo post com ID mais robusto
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 15)
    
    const newPost: Post = {
      id: `${timestamp}-${randomSuffix}`,
      content: content.trim(),
      author: author.trim(),
      author_name: author_name.trim(),
      author_photo: (typeof author_photo === 'string' && author_photo.trim()) ? author_photo.trim() : null,
      visibility,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      is_dj_post: Boolean(is_dj_post)
    }

    // Adicionar no início da lista
    existingPosts.unshift(newPost)

    // Manter apenas os últimos 1000 posts para não ocupar muito espaço
    if (existingPosts.length > 1000) {
      existingPosts.splice(1000)
    }

    // Salvar com timeout
    try {
      await Promise.race([
        savePosts(existingPosts),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao salvar posts')), 5000)
        )
      ])
    } catch (saveError) {
      console.error('Erro ao salvar posts:', saveError)
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar post no servidor' },
        { status: 500 }
      )
    }

    console.log(`✅ Post criado com sucesso: ${author_name} - "${content.substring(0, 50)}..."`)

    return NextResponse.json({
      success: true,
      post: newPost,
      message: 'Post criado com sucesso',
      total_posts: existingPosts.length
    }, { status: 201 })
    
  } catch (error) {
    console.error('Erro crítico ao criar post:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
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

    const posts = await loadPosts()
    const postIndex = posts.findIndex(p => p.id == post_id)

    if (postIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Post não encontrado' },
        { status: 404 }
      )
    }

    // Aplicar ação
    if (action === 'like') {
      posts[postIndex].likes_count += 1
    } else if (action === 'comment') {
      posts[postIndex].comments_count += 1
    }

    await savePosts(posts)

    return NextResponse.json({
      success: true,
      post: posts[postIndex],
      message: 'Post atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar post:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar post' },
      { status: 500 }
    )
  }
}
