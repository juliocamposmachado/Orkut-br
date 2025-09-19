import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase para API Routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(request: NextRequest) {
  try {
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
    // Verificar autenticação via header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Criar cliente temporário para verificar o token
    const tempSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })
    
    const { data: { user }, error: authError } = await tempSupabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Erro de autenticação:', authError)
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
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

    // Gerar slug a partir do título
    const generateSlug = (title: string) => {
      return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .substring(0, 50) // Limita o tamanho
    }

    let slug = generateSlug(title)
    
    // Verificar se o slug já existe e gerar um único se necessário
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single()
    
    if (existingPost) {
      slug = `${slug}-${Date.now()}`
    }

    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert({
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        author_id: user.id,
        featured_image: featured_image || null,
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

    if (error) {
      console.error('Erro ao inserir post na base de dados:', {
        error,
        postData: {
          title,
          slug,
          author_id: user.id,
          status,
          tags
        }
      })
      throw error
    }

    return NextResponse.json({ post }, { status: 201 })

  } catch (error: any) {
    console.error('Erro ao criar post do blog:', {
      error: error?.message || error,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack?.split('\n')[0]
    })
    
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
    
    // Detectar problemas de RLS ou permissões
    if (error?.message?.includes('Row Level Security') || 
        error?.message?.includes('policy') ||
        error?.code === '42501') {
      return NextResponse.json(
        { 
          error: 'Erro de permissão',
          details: 'Problema nas políticas RLS ou permissões da tabela blog_posts.',
          message: error?.message || 'Erro de permissão'
        },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error?.message || 'Erro desconhecido',
        code: error?.code
      },
      { status: 500 }
    )
  }
}
