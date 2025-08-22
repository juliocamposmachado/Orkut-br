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
    const body = await request.json()
    const { content, author, author_name, author_photo, visibility = 'public', is_dj_post = false } = body

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

    // Carregar posts existentes
    const existingPosts = await loadPosts()

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
      created_at: new Date().toISOString(),
      is_dj_post
    }

    // Adicionar no início da lista
    existingPosts.unshift(newPost)

    // Manter apenas os últimos 500 posts para não ocupar muito espaço
    if (existingPosts.length > 500) {
      existingPosts.splice(500)
    }

    // Salvar
    await savePosts(existingPosts)

    console.log(`✅ Post criado: ${author_name} - "${content.substring(0, 50)}..."`)

    return NextResponse.json({
      success: true,
      post: newPost,
      message: 'Post criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar post:', error)
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
