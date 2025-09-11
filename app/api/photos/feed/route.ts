import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

// Cliente Supabase com service role para ler dados
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Arquivo local de backup
const PHOTOS_FILE = path.join(process.cwd(), 'data', 'photos-feed.json')

// Função para carregar fotos do arquivo local
async function loadLocalPhotos() {
  try {
    const data = await fs.readFile(PHOTOS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

/**
 * GET /api/photos/feed - Buscar fotos do feed global
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log('📸 [Feed API] Buscando fotos do feed global')

  try {
    // Parâmetros de query
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'recent' // recent, popular, oldest
    
    // Calcular offset
    const offset = (page - 1) * limit

    console.log(`📄 [Feed API] Página ${page}, limit ${limit}, ordenação: ${sort}`)

    // Query base
    let query = supabase
      .from('photos_feed')
      .select(`
        id,
        user_id,
        user_name,
        user_avatar,
        imgur_id,
        imgur_url,
        imgur_page_url,
        width,
        height,
        file_size,
        original_filename,
        title,
        description,
        tags,
        likes_count,
        comments_count,
        shares_count,
        views_count,
        created_at,
        updated_at
      `)
      .eq('is_public', true) // Apenas fotos públicas

    // Aplicar ordenação
    switch (sort) {
      case 'popular':
        query = query.order('likes_count', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1)

    let photos: any[] = []
    let totalPhotos = 0
    let dataSource = 'supabase'

    try {
      const { data, error: photosError } = await query

      if (photosError) {
        throw new Error(`Supabase error: ${photosError.message}`)
      }

      photos = data || []
      
      // Buscar total de fotos para meta informação
      const { count } = await supabase
        .from('photos_feed')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true)
        
      totalPhotos = count || 0
      console.log('✅ [Feed API] Dados carregados do Supabase')
      
    } catch (supabaseError) {
      console.warn('⚠️ [Feed API] Erro no Supabase, usando arquivo local:', supabaseError)
      
      // Se Supabase falhar, usar arquivo local
      try {
        const localPhotos = await loadLocalPhotos()
        
        if (localPhotos && Array.isArray(localPhotos)) {
          // Aplicar ordenação
          let sortedPhotos = [...localPhotos]
          switch (sort) {
            case 'popular':
              sortedPhotos.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
              break
            case 'oldest':
              sortedPhotos.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              break
            case 'recent':
            default:
              sortedPhotos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              break
          }
          
          // Aplicar paginação
          photos = sortedPhotos.slice(offset, offset + limit)
          totalPhotos = sortedPhotos.length
          dataSource = 'local_backup'
          console.log(`✅ [Feed API] ${photos.length} fotos carregadas do arquivo local`)
        } else {
          photos = []
          totalPhotos = 0
        }
        
      } catch (localError) {
        console.error('❌ [Feed API] Erro tanto no Supabase quanto no arquivo local:', localError)
        return NextResponse.json({
          success: false,
          error: 'Erro ao buscar fotos (Supabase e local falharam)',
          details: `Supabase: ${supabaseError}; Local: ${localError}`
        }, { status: 500 })
      }
    }

    const processingTime = Date.now() - startTime

    console.log(`✅ [Feed API] ${photos?.length || 0} fotos encontradas em ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      data: {
        photos: photos || [],
        pagination: {
          page,
          limit,
          total: totalPhotos || 0,
          total_pages: Math.ceil((totalPhotos || 0) / limit),
          has_next: ((page * limit) < (totalPhotos || 0)),
          has_prev: page > 1
        },
        sort,
        processing_time_ms: processingTime,
        data_source: dataSource
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    console.error(`❌ [Feed API] Erro após ${processingTime}ms:`, errorMessage)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: errorMessage,
      processing_time_ms: processingTime
    }, { status: 500 })
  }
}

/**
 * POST /api/photos/feed - Incrementar views de uma foto
 */
export async function POST(request: NextRequest) {
  console.log('👀 [Feed API] Incrementando view de foto')

  try {
    const body = await request.json()
    const { photo_id } = body

    if (!photo_id) {
      return NextResponse.json({
        success: false,
        error: 'ID da foto é obrigatório'
      }, { status: 400 })
    }

    // Incrementar contador de views
    const { error } = await supabase
      .from('photos_feed')
      .update({ 
        views_count: supabase.rpc('increment_views', { photo_id }),
        updated_at: new Date().toISOString()
      })
      .eq('id', photo_id)

    if (error) {
      console.error('❌ [Feed API] Erro ao incrementar views:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao incrementar views',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ [Feed API] Views incrementadas com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Views incrementadas'
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('❌ [Feed API] Erro ao incrementar views:', errorMessage)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: errorMessage
    }, { status: 500 })
  }
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
