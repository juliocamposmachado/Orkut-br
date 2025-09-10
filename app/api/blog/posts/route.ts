import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parâmetros de consulta
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50) // Max 50 posts por página
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')
    const featured = searchParams.get('featured') === 'true'
    const author = searchParams.get('author')
    
    const offset = (page - 1) * limit

    // Base query
    let query = supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        tags,
        status,
        views_count,
        likes_count,
        comments_count,
        created_at,
        profiles:author_id (
          id,
          display_name,
          username,
          photo_url
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    // Aplicar filtros - removido category e featured pois não existem no schema

    if (author) {
      query = query.eq('author_id', author)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }

    if (tag) {
      query = query.contains('tags', [tag])
    }

    // Contar total de posts (para paginação)
    const { count } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    // Aplicar os mesmos filtros na contagem
    let countQuery = supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    // Filtros removidos - campos não existem no schema
    if (author) countQuery = countQuery.eq('author_id', author)
    if (search) countQuery = countQuery.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
    if (tag) countQuery = countQuery.contains('tags', [tag])

    const { count: filteredCount } = await countQuery

    // Executar query com paginação
    const { data: posts, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Erro ao buscar posts:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Calcular informações de paginação
    const totalPosts = filteredCount || 0
    const totalPages = Math.ceil(totalPosts / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      posts: posts || [],
      pagination: {
        page,
        limit,
        totalPosts,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        category,
        search,
        tag,
        featured,
        author
      }
    })

  } catch (error) {
    console.error('Erro na API de posts do blog:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      content,
      excerpt,
      tags = [],
      status = 'draft',
      featured_image
    } = body

    // Validações básicas
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Título e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Gerar slug a partir do título
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .trim()
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados

    // Verificar se o slug já existe
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingPost) {
      return NextResponse.json(
        { error: 'Já existe um post com este título (slug duplicado)' },
        { status: 400 }
      )
    }

    // Obter usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Criar o post
    const { data: newPost, error } = await supabase
      .from('blog_posts')
      .insert({
        title,
        slug,
        content,
        excerpt,
        tags,
        status,
        featured_image,
        author_id: user.id
      })
      .select(`
        id,
        title,
        slug,
        excerpt,
        tags,
        status,
        featured_image,
        views_count,
        likes_count,
        comments_count,
        created_at,
        updated_at,
        profiles:author_id (
          id,
          display_name,
          username,
          photo_url
        )
      `)
      .single()

    if (error) {
      console.error('Erro ao criar post:', error)
      return NextResponse.json(
        { error: 'Erro ao criar post' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      post: newPost,
      message: 'Post criado com sucesso!'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro na criação de post:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
