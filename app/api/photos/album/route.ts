import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

/**
 * GET /api/photos/album - Listar fotos do álbum do usuário
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log('📸 [Album] Buscando fotos do álbum')

  try {
    const { searchParams } = new URL(request.url)
    
    // Parâmetros da query
    const user_token = searchParams.get('user_token')
    const user_id = searchParams.get('user_id') // Para buscar álbum de outro usuário (fotos públicas)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // máximo 50 por vez
    const is_public = searchParams.get('is_public') === 'true'
    
    const offset = (page - 1) * limit

    let targetUserId: string | null = null
    let isOwnAlbum = false

    // Se user_id foi fornecido, buscar álbum desse usuário (apenas fotos públicas)
    if (user_id) {
      targetUserId = user_id
      console.log('👁️ [Album] Buscando álbum público do usuário:', user_id)
    }
    // Se user_token foi fornecido, buscar álbum do usuário logado
    else if (user_token) {
      console.log('🔐 [Album] Verificando autenticação para álbum pessoal...')
      const { data: { user }, error: authError } = await supabase.auth.getUser(user_token)
      
      if (authError || !user) {
        return NextResponse.json({
          success: false,
          error: 'Token de autenticação inválido'
        }, { status: 401 })
      }
      
      targetUserId = user.id
      isOwnAlbum = true
      console.log('✅ [Album] Usuário autenticado:', user.email)
    }
    else {
      return NextResponse.json({
        success: false,
        error: 'É necessário fornecer user_token (para seu álbum) ou user_id (para álbum público de outro usuário)'
      }, { status: 400 })
    }

    // Construir query
    let query = supabase
      .from('album_fotos')
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          photo_url
        )
      `)
      .eq('user_id', targetUserId)

    // Se não for álbum próprio, filtrar apenas fotos públicas
    if (!isOwnAlbum) {
      query = query.eq('is_public', true)
    }

    // Filtro adicional de is_public se especificado
    if (is_public) {
      query = query.eq('is_public', true)
    }

    // Paginação e ordenação
    const { data: photos, error: dbError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (dbError) {
      console.error('❌ [Album] Erro no banco:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar fotos do álbum',
        details: dbError.message
      }, { status: 500 })
    }

    // Contar total de fotos (para paginação)
    const { count: totalCount, error: countError } = await supabase
      .from('album_fotos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .eq('is_public', isOwnAlbum ? undefined : true) // só contar públicas se não for álbum próprio

    if (countError) {
      console.warn('⚠️ [Album] Erro ao contar fotos:', countError.message)
    }

    const processingTime = Date.now() - startTime
    const total = totalCount || photos?.length || 0
    const hasNextPage = (offset + limit) < total
    const hasPrevPage = page > 1

    console.log('✅ [Album] Fotos encontradas:', {
      user_id: targetUserId,
      is_own_album: isOwnAlbum,
      photos_returned: photos?.length || 0,
      total_photos: total,
      page,
      processingTime: `${processingTime}ms`
    })

    return NextResponse.json({
      success: true,
      message: `${photos?.length || 0} foto(s) encontrada(s)`,
      data: {
        photos: photos || [],
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage,
          next_page: hasNextPage ? page + 1 : null,
          prev_page: hasPrevPage ? page - 1 : null
        },
        album_info: {
          user_id: targetUserId,
          is_own_album: isOwnAlbum,
          photos_count: total
        },
        processing_time_ms: processingTime
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    console.error(`❌ [Album] Erro após ${processingTime}ms:`, errorMessage)
    
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
