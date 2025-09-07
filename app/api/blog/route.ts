import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const tag = searchParams.get('tag') || ''
    const status = searchParams.get('status') || 'published'
    
    const offset = (page - 1) * limit

    let query = supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        status,
        tags,
        views_count,
        likes_count,
        comments_count,
        created_at,
        updated_at,
        profiles!blog_posts_author_id_fkey (
          id,
          display_name,
          photo_url,
          username
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Se não for o autor, mostrar apenas posts publicados
    const { data: { user } } = await supabase.auth.getUser()
    if (status === 'published' || !user) {
      query = query.eq('status', 'published')
    }

    // Filtros de busca
    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`)
    }

    if (tag) {
      query = query.contains('tags', [tag])
    }

    const { data: posts, error } = await query

    if (error) throw error

    // Contar total de posts para paginação
    let countQuery = supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })

    if (status === 'published' || !user) {
      countQuery = countQuery.eq('status', 'published')
    }

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`)
    }

    if (tag) {
      countQuery = countQuery.contains('tags', [tag])
    }

    const { count, error: countError } = await countQuery

    if (countError) throw countError

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      posts: posts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error: any) {
    console.error('Erro ao buscar posts do blog:', error)
    
    // Detectar se a tabela não existe
    if (error?.message?.includes('relation "blog_posts" does not exist') || 
        error?.code === '42P01') {
      return NextResponse.json(
        { 
          error: 'Blog não configurado',
          details: 'A tabela blog_posts não existe. Execute a migration no Supabase.',
          migration_needed: true
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { title, content, excerpt, featured_image, status, tags } = await request.json()

    // Validações
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Título e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert({
        title,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        author_id: user.id,
        featured_image,
        status: status || 'draft',
        tags: tags || []
      })
      .select(`
        id,
        title,
        slug,
        content,
        excerpt,
        featured_image,
        status,
        tags,
        views_count,
        likes_count,
        comments_count,
        created_at,
        updated_at,
        profiles!blog_posts_author_id_fkey (
          id,
          display_name,
          photo_url,
          username
        )
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ post }, { status: 201 })

  } catch (error: any) {
    console.error('Erro ao criar post do blog:', error)
    
    // Detectar se a tabela não existe
    if (error?.message?.includes('relation "blog_posts" does not exist') || 
        error?.code === '42P01') {
      return NextResponse.json(
        { 
          error: 'Blog não configurado',
          details: 'A tabela blog_posts não existe. Execute a migration no Supabase.',
          migration_needed: true
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
