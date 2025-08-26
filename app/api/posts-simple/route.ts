import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com service_role para bypass RLS temporariamente
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

// POST - Criar novo post (versão simplificada para debug)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 [SIMPLE] Dados recebidos:', body)
    
    const { content, author, author_name, author_photo, visibility = 'public', is_dj_post = false } = body

    // Validações básicas
    if (!content || !author) {
      console.error('❌ [SIMPLE] Dados obrigatórios ausentes:', { content: !!content, author: !!author })
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

    // Preparar dados para inserção
    const insertData = {
      content: content.trim(),
      author: author,
      author_name: author_name || 'Usuário',
      author_photo: author_photo || null,
      visibility: visibility,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      is_dj_post: is_dj_post || false
    }
    
    console.log('📤 [SIMPLE] Enviando para Supabase:', insertData)
    
    // Usar client admin para bypass RLS
    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ [SIMPLE] Erro no Supabase:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: `Erro no banco: ${error.message}`,
          details: error
        },
        { status: 500 }
      )
    }

    console.log('✅ [SIMPLE] Post criado com sucesso:', data)
    
    return NextResponse.json({
      success: true,
      post: data,
      message: 'Post criado com sucesso (modo simples)',
      source: 'database'
    })

  } catch (error: any) {
    console.error('❌ [SIMPLE] Erro crítico:', error)
    return NextResponse.json(
      { success: false, error: `Erro crítico: ${error.message}` },
      { status: 500 }
    )
  }
}

// GET - Buscar posts (versão simplificada)
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [SIMPLE] Carregando posts...')
    
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('❌ [SIMPLE] Erro ao carregar posts:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao carregar posts' },
        { status: 500 }
      )
    }

    console.log(`✅ [SIMPLE] Posts carregados: ${data?.length || 0}`)
    
    return NextResponse.json({
      success: true,
      posts: data || [],
      total: data?.length || 0,
      source: 'database-simple'
    })

  } catch (error: any) {
    console.error('❌ [SIMPLE] Erro ao carregar posts:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar posts' },
      { status: 500 }
    )
  }
}
