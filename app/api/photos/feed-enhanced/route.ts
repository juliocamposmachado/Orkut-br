import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com service role para ler dados
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

/**
 * GET /api/photos/feed-enhanced - Feed global aprimorado que inclui fotos de album_fotos
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log('📸 [Enhanced Feed] Buscando feed global aprimorado')

  try {
    // Parâmetros de query
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'recent' // recent, popular, oldest
    const source = searchParams.get('source') || 'all' // all, feed, album
    
    // Calcular offset
    const offset = (page - 1) * limit

    console.log(`📄 [Enhanced Feed] Página ${page}, limit ${limit}, ordenação: ${sort}, fonte: ${source}`)

    let allPhotos = []

    // 1. Buscar fotos do feed tradicional (photos_feed)
    if (source === 'all' || source === 'feed') {
      const { data: feedPhotos, error: feedError } = await supabase
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
        .eq('is_public', true)

      if (!feedError && feedPhotos) {
        const formattedFeedPhotos = feedPhotos.map(photo => ({
          ...photo,
          source: 'feed' as const,
          album_id: null
        }))
        allPhotos.push(...formattedFeedPhotos)
      } else if (feedError) {
        console.warn('⚠️ [Enhanced Feed] Erro ao buscar photos_feed:', feedError.message)
      }
    }

    // 2. Buscar fotos dos álbuns (album_fotos) 
    if (source === 'all' || source === 'album') {
      const { data: albumPhotos, error: albumError } = await supabase
        .from('album_fotos')
        .select(`
          id,
          user_id,
          imgur_link,
          titulo,
          descricao,
          likes_count,
          comments_count,
          views_count,
          is_public,
          created_at,
          updated_at,
          profiles:user_id (
            username,
            display_name,
            photo_url
          )
        `)
        .eq('is_public', true)

      if (!albumError && albumPhotos) {
        const formattedAlbumPhotos = albumPhotos.map(photo => ({
          id: `album_${photo.id}`, // Prefixo para evitar conflito de ID
          user_id: photo.user_id,
          user_name: Array.isArray(photo.profiles) && photo.profiles[0] 
            ? photo.profiles[0].display_name || photo.profiles[0].username || 'Usuário'
            : 'Usuário',
          user_avatar: Array.isArray(photo.profiles) && photo.profiles[0] 
            ? photo.profiles[0].photo_url || null
            : null,
          imgur_id: photo.imgur_link.match(/\/([a-zA-Z0-9]+)\.(jpg|jpeg|png|gif|webp)$/)?.[1] || '',
          imgur_url: photo.imgur_link,
          imgur_page_url: photo.imgur_link,
          width: 0, // Não temos esses dados no album_fotos
          height: 0,
          file_size: 0,
          original_filename: photo.titulo,
          title: photo.titulo,
          description: photo.descricao || null,
          tags: [] as string[],
          likes_count: photo.likes_count,
          comments_count: photo.comments_count,
          shares_count: 0,
          views_count: photo.views_count,
          created_at: photo.created_at,
          updated_at: photo.updated_at,
          source: 'album' as const,
          album_id: photo.id
        }))
        allPhotos.push(...formattedAlbumPhotos)
      } else if (albumError) {
        console.warn('⚠️ [Enhanced Feed] Erro ao buscar album_fotos:', albumError.message)
      }
    }

    // 3. Remover duplicatas (mesmo imgur_url)
    const uniquePhotos = allPhotos.filter((photo, index, self) => 
      index === self.findIndex(p => p.imgur_url === photo.imgur_url)
    )

    // 4. Aplicar ordenação
    let sortedPhotos = uniquePhotos
    switch (sort) {
      case 'popular':
        sortedPhotos.sort((a, b) => {
          const scoreA = (a.likes_count * 3) + (a.views_count * 1) + (a.comments_count * 5)
          const scoreB = (b.likes_count * 3) + (b.views_count * 1) + (b.comments_count * 5)
          return scoreB - scoreA
        })
        break
      case 'oldest':
        sortedPhotos.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'recent':
      default:
        sortedPhotos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    // 5. Aplicar paginação
    const paginatedPhotos = sortedPhotos.slice(offset, offset + limit)
    const totalPhotos = sortedPhotos.length

    const processingTime = Date.now() - startTime

    console.log(`✅ [Enhanced Feed] ${paginatedPhotos.length} fotos encontradas de ${totalPhotos} total em ${processingTime}ms`)
    console.log(`📊 [Enhanced Feed] Distribuição: ${allPhotos.filter(p => p.source === 'feed').length} feed + ${allPhotos.filter(p => p.source === 'album').length} álbum`)

    return NextResponse.json({
      success: true,
      data: {
        photos: paginatedPhotos,
        pagination: {
          page,
          limit,
          total: totalPhotos,
          total_pages: Math.ceil(totalPhotos / limit),
          has_next: ((page * limit) < totalPhotos),
          has_prev: page > 1
        },
        stats: {
          total_photos: totalPhotos,
          feed_photos: allPhotos.filter(p => p.source === 'feed').length,
          album_photos: allPhotos.filter(p => p.source === 'album').length,
          unique_photos: uniquePhotos.length,
          duplicates_removed: allPhotos.length - uniquePhotos.length
        },
        sort,
        source,
        processing_time_ms: processingTime
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    console.error(`❌ [Enhanced Feed] Erro após ${processingTime}ms:`, errorMessage)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: errorMessage,
      processing_time_ms: processingTime
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
