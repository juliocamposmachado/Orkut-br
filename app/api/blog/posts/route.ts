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
        featured_image_url,
        category,
        tags,
        status,
        is_featured,
        views_count,
        likes_count,
        comments_count,
        published_at,
        created_at,
        profiles:author_id (
          id,
          display_name,
          username,
          photo_url
        )
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    // Aplicar filtros
    if (category) {
      query = query.eq('category', category)
    }

    if (featured) {
      query = query.eq('is_featured', true)
    }

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

    if (category) countQuery = countQuery.eq('category', category)
    if (featured) countQuery = countQuery.eq('is_featured', true)
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
      category = 'geral',
      tags = [],
      status = 'draft',
      is_featured = false,
      featured_image_url,
      published_at
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

    // Criar o post
    const { data: newPost, error } = await supabase
      .from('blog_posts')
      .insert({
        title,
        slug,
        content,
        excerpt,
        category,
        tags,
        status,
        is_featured,
        featured_image_url,
        published_at: status === 'published' ? (published_at || new Date().toISOString()) : null,
        author_id: 'auth.uid()' // Será preenchido pelo RLS
      })
      .select(`
        id,
        title,
        slug,
        excerpt,
        category,
        tags,
        status,
        is_featured,
        created_at,
        published_at,
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
