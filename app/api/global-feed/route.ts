import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface GlobalFeedPost {
  id: number
  post_id: number
  author: string
  author_name: string
  author_photo: string | null
  content: string
  likes_count: number
  comments_count: number
  shares_count: number
  visibility: string
  is_dj_post: boolean
  created_at: string
  updated_at: string
}

// Cache em memória como fallback
let memoryFeed: GlobalFeedPost[] = [
  {
    id: 1,
    post_id: 1,
    author: "system",
    author_name: "Sistema Orkut",
    author_photo: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=150&h=150&fit=crop&crop=face",
    content: "🎉 Bem-vindos ao Feed Global do Orkut! Agora você pode ver todas as postagens públicas da comunidade! 🌍✨",
    likes_count: 42,
    comments_count: 15,
    shares_count: 8,
    visibility: "public",
    is_dj_post: false,
    created_at: new Date(Date.now() - 1000000).toISOString(),
    updated_at: new Date(Date.now() - 1000000).toISOString()
  },
  {
    id: 2,
    post_id: 2,
    author: "dj-orky",
    author_name: "DJ Orky",
    author_photo: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=face",
    content: "🎵 Acabei de descobrir uma música incrível! A energia está contagiante hoje! 🔥🎧",
    likes_count: 28,
    comments_count: 9,
    shares_count: 12,
    visibility: "public",
    is_dj_post: true,
    created_at: new Date(Date.now() - 500000).toISOString(),
    updated_at: new Date(Date.now() - 500000).toISOString()
  }
]

// GET - Buscar feed global otimizado
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    console.log('🔄 Carregando feed global:', { limit, offset })
    
    // Verificar se Supabase está configurado corretamente
    const hasValidSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (hasValidSupabase && supabase) {
      try {
        console.log('🔄 Carregando feed global do Supabase...')
        
        // Buscar do cache global_feed para máxima performance
        const { data, error, count } = await supabase
          .from('global_feed')
          .select(`
            id,
            post_id,
            author,
            author_name,
            author_photo,
            content,
            likes_count,
            comments_count,
            shares_count,
            visibility,
            is_dj_post,
            created_at,
            updated_at
          `, { count: 'exact' })
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (!error && data) {
          console.log(`✅ Feed global carregado do Supabase: ${data.length} posts`)
          
          return NextResponse.json({
            success: true,
            posts: data,
            total: count || 0,
            limit,
            offset,
            hasMore: (count || 0) > offset + limit,
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

    // Fallback para memória
    const sortedFeed = [...memoryFeed].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    const paginatedFeed = sortedFeed.slice(offset, offset + limit)
    
    console.log(`🔄 Feed global carregado da memória: ${paginatedFeed.length} posts`)
    
    return NextResponse.json({
      success: true,
      posts: paginatedFeed,
      total: sortedFeed.length,
      limit,
      offset,
      hasMore: sortedFeed.length > offset + limit,
      source: 'memory'
    })
  } catch (error) {
    console.error('❌ Erro ao carregar feed global:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar feed global' },
      { status: 500 }
    )
  }
}

// POST - Adicionar post ao feed global (chamado automaticamente pelo trigger)
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { post_id, force_refresh = false } = body

    // Se force_refresh, recarregar feed do banco
    if (force_refresh) {
      const { data, error } = await supabase
        .from('global_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        console.log(`🔄 Feed global recarregado: ${data.length} posts`)
        return NextResponse.json({
          success: true,
          posts: data,
          message: 'Feed global recarregado',
          source: 'database'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Feed será atualizado automaticamente via trigger'
    })
  } catch (error) {
    console.error('❌ Erro ao atualizar feed global:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar feed global' },
      { status: 500 }
    )
  }
}
