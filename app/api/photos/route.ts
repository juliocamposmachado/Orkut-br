import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se as variáveis estão configuradas
if (!supabaseUrl || !supabaseServiceKey || 
    supabaseUrl.includes('placeholder') || 
    supabaseUrl.includes('your_') ||
    !supabaseUrl.startsWith('https://')) {
  console.warn('Supabase não configurado para photos API')
}

// Criar cliente apenas se configurado corretamente
const supabase = (supabaseUrl && supabaseServiceKey &&
                 !supabaseUrl.includes('placeholder') &&
                 !supabaseUrl.includes('your_') &&
                 supabaseUrl.startsWith('https://'))
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Cache simples em memória (para produção, use Redis)
const cache = new Map<string, { data: any; expires: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

/**
 * Função para cache com expiração
 */
function getCachedData(key: string) {
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  cache.delete(key)
  return null
}

function setCachedData(key: string, data: any, duration = CACHE_DURATION) {
  cache.set(key, {
    data,
    expires: Date.now() + duration
  })
}

interface PhotoFilters {
  userId?: string
  category?: string
  search?: string
  limit?: number
  offset?: number
  publicOnly?: boolean
}

/**
 * GET /api/photos - Lista fotos com filtros e paginação otimizada
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extrair parâmetros de filtro
    const filters: PhotoFilters = {
      userId: searchParams.get('userId') || undefined,
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      publicOnly: searchParams.get('publicOnly') !== 'false'
    }

    // Se Supabase não estiver configurado, retornar dados demo realistas
    if (!supabase) {
      const demoPhotos = [
        {
          id: '1',
          user_id: 'demo-user-1',
          url: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800',
          thumbnail_url: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
          preview_url: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
          title: 'Pôr do Sol na Praia',
          description: 'Uma linda vista do pôr do sol na praia durante o verão',
          category: 'natureza',
          likes_count: 42,
          comments_count: 8,
          views_count: 156,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          user_name: 'Ana Silva',
          user_avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150'
        },
        {
          id: '2', 
          user_id: 'demo-user-2',
          url: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=800',
          thumbnail_url: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
          preview_url: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
          title: 'Café da Manhã Saudável',
          description: 'Delicioso café da manhã com frutas e aveia',
          category: 'culinaria',
          likes_count: 28,
          comments_count: 5,
          views_count: 89,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          user_name: 'Carlos Santos',
          user_avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
        },
        {
          id: '3',
          user_id: 'demo-user-3', 
          url: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800',
          thumbnail_url: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
          preview_url: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
          title: 'Paisagem Urbana',
          description: 'Vista incrível da cidade ao anoitecer',
          category: 'lifestyle',
          likes_count: 67,
          comments_count: 12,
          views_count: 234,
          created_at: new Date(Date.now() - 10800000).toISOString(),
          user_name: 'Marina Costa',
          user_avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150'
        },
        {
          id: '4',
          user_id: 'demo-user-4',
          url: 'https://images.pexels.com/photos/1375849/pexels-photo-1375849.jpeg?auto=compress&cs=tinysrgb&w=800',
          thumbnail_url: 'https://images.pexels.com/photos/1375849/pexels-photo-1375849.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
          preview_url: 'https://images.pexels.com/photos/1375849/pexels-photo-1375849.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
          title: 'Arte Digital',
          description: 'Criação artística usando técnicas digitais',
          category: 'arte',
          likes_count: 35,
          comments_count: 7,
          views_count: 127,
          created_at: new Date(Date.now() - 14400000).toISOString(),
          user_name: 'Pedro Lima',
          user_avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150'
        }
      ]

      // Aplicar filtros básicos nos dados demo
      let filteredPhotos = demoPhotos
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        filteredPhotos = demoPhotos.filter(photo => 
          photo.title.toLowerCase().includes(searchTerm) ||
          photo.description?.toLowerCase().includes(searchTerm) ||
          photo.category?.toLowerCase().includes(searchTerm) ||
          photo.user_name.toLowerCase().includes(searchTerm)
        )
      }
      
      if (filters.category) {
        filteredPhotos = filteredPhotos.filter(photo => photo.category === filters.category)
      }
      
      // Aplicar paginação
      const startIndex = filters.offset || 0
      const endIndex = startIndex + (filters.limit || 20)
      const paginatedPhotos = filteredPhotos.slice(startIndex, endIndex)
      
      return NextResponse.json({
        photos: paginatedPhotos,
        pagination: {
          limit: filters.limit || 20,
          offset: startIndex,
          total: filteredPhotos.length,
          hasMore: endIndex < filteredPhotos.length
        },
        stats: {
          total: demoPhotos.length,
          categories: {
            natureza: 1,
            culinaria: 1, 
            lifestyle: 1,
            arte: 1
          },
          public: demoPhotos.length,
          private: 0
        },
        popularCategories: [
          { category: 'natureza', count: 1 },
          { category: 'culinaria', count: 1 },
          { category: 'lifestyle', count: 1 },
          { category: 'arte', count: 1 }
        ],
        filters: {
          ...filters,
          applied: Object.entries(filters).filter(([key, value]) => 
            value !== undefined && value !== null && value !== ''
          ).length > 2
        },
        demo: true,
        message: 'Dados de demonstração - Configure o Supabase para funcionalidade completa',
        timestamp: new Date().toISOString()
      })
    }


    // Verificar limites
    if (filters.limit! > 100) {
      filters.limit = 100 // Máximo 100 itens por página
    }

    // Gerar chave do cache baseada nos filtros
    const cacheKey = `photos_${JSON.stringify(filters)}`
    
    // Verificar cache primeiro
    const cachedResult = getCachedData(cacheKey)
    if (cachedResult) {
      return NextResponse.json({
        ...cachedResult,
        cached: true,
        timestamp: new Date().toISOString()
      })
    }

    // Construir query otimizada usando a função do banco
    let query = supabase.rpc('get_photos_optimized', {
      p_user_id: filters.userId || null,
      p_category: filters.category || null,
      p_limit: filters.limit || 20,
      p_offset: filters.offset || 0,
      p_public_only: filters.publicOnly !== false
    })

    // Executar query
    const { data: photos, error, count } = await query

    if (error) {
      console.error('Erro na query de fotos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar fotos', details: error.message },
        { status: 500 }
      )
    }

    // Filtrar por busca de texto se especificado (pós-processamento)
    let filteredPhotos = photos || []
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filteredPhotos = filteredPhotos.filter((photo: any) =>
        photo.title?.toLowerCase().includes(searchTerm) ||
        photo.description?.toLowerCase().includes(searchTerm) ||
        photo.category?.toLowerCase().includes(searchTerm) ||
        photo.user_name?.toLowerCase().includes(searchTerm)
      )
    }

    // Buscar estatísticas gerais (com cache separado)
    const statsKey = `photo_stats_${filters.userId || 'all'}`
    let stats = getCachedData(statsKey)
    
    if (!stats) {
      // Query otimizada para estatísticas
      let statsQuery = supabase
        .from('user_photos')
        .select('category, is_public', { count: 'exact' })
        .eq('is_processed', true)

      if (filters.userId) {
        statsQuery = statsQuery.eq('user_id', filters.userId)
      }
      
      if (filters.publicOnly !== false) {
        statsQuery = statsQuery.eq('is_public', true)
      }

      const { data: statsData, count: totalCount } = await statsQuery

      // Contar por categoria
      const categoryStats = (statsData || []).reduce((acc: any, photo: any) => {
        const cat = photo.category || 'sem-categoria'
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      }, {})

      stats = {
        total: totalCount || 0,
        categories: categoryStats,
        public: (statsData || []).filter((p: any) => p.is_public).length,
        private: (statsData || []).filter((p: any) => !p.is_public).length
      }

      // Cache por mais tempo para estatísticas (10 minutos)
      setCachedData(statsKey, stats, 10 * 60 * 1000)
    }

    // Buscar categorias populares (cached)
    const categoriesKey = 'popular_categories'
    let popularCategories = getCachedData(categoriesKey)
    
    if (!popularCategories) {
      const { data: categoriesData } = await supabase
        .from('user_photos')
        .select('category')
        .not('category', 'is', null)
        .eq('is_public', true)
        .eq('is_processed', true)

      const categoryCount = (categoriesData || []).reduce((acc: any, photo: any) => {
        acc[photo.category] = (acc[photo.category] || 0) + 1
        return acc
      }, {})

      popularCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([category, count]) => ({ category, count }))

      // Cache por 15 minutos
      setCachedData(categoriesKey, popularCategories, 15 * 60 * 1000)
    }

    const result = {
      photos: filteredPhotos,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: stats.total,
        hasMore: (filters.offset! + filters.limit!) < stats.total
      },
      stats,
      popularCategories,
      filters: {
        ...filters,
        applied: Object.entries(filters).filter(([key, value]) => 
          value !== undefined && value !== null && value !== ''
        ).length > 2 // mais que limit e offset
      },
      cached: false,
      timestamp: new Date().toISOString()
    }

    // Cachear resultado
    setCachedData(cacheKey, result)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro na API de fotos:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/photos/{id}/view - Incrementa visualizações de forma otimizada
 */
export async function POST(request: NextRequest) {
  try {
    // Se Supabase não estiver configurado, retornar erro amigável
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Funcionalidade de fotos não disponível',
        demo: true 
      }, { status: 503 })
    }

    const body = await request.json()
    const { photoId, action } = body

    if (!photoId) {
      return NextResponse.json({ error: 'ID da foto necessário' }, { status: 400 })
    }

    switch (action) {
      case 'view':
        // Usar função otimizada do banco para incrementar views
        const { error: viewError } = await supabase.rpc('increment_photo_views', {
          p_photo_id: photoId
        })

        if (viewError) {
          throw viewError
        }

        // Limpar cache relacionado
        const keysToDelete = Array.from(cache.keys()).filter(key => 
          key.includes('photos_') || key.includes('photo_stats_')
        )
        keysToDelete.forEach(key => cache.delete(key))

        return NextResponse.json({ success: true, action: 'view_incremented' })

      case 'like':
        // Verificar autenticação para likes
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
          return NextResponse.json({ error: 'Autenticação necessária para curtir' }, { status: 401 })
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        )

        if (authError || !user) {
          return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
        }

        // Verificar se já curtiu
        const { data: existingLike } = await supabase
          .from('photo_likes')
          .select('id')
          .eq('photo_id', photoId)
          .eq('user_id', user.id)
          .single()

        if (existingLike) {
          // Remover like
          const { error: deleteLikeError } = await supabase
            .from('photo_likes')
            .delete()
            .eq('photo_id', photoId)
            .eq('user_id', user.id)

          if (deleteLikeError) throw deleteLikeError

          return NextResponse.json({ success: true, action: 'like_removed' })
        } else {
          // Adicionar like
          const { error: insertLikeError } = await supabase
            .from('photo_likes')
            .insert({
              photo_id: photoId,
              user_id: user.id
            })

          if (insertLikeError) throw insertLikeError

          return NextResponse.json({ success: true, action: 'like_added' })
        }

      default:
        return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 })
    }

  } catch (error) {
    console.error('Erro na ação de foto:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
