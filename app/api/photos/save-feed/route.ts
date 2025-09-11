import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com service role para inserir dados
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

interface SavePhotoFeedRequest {
  // Dados da imagem Imgur
  imgur_id: string
  imgur_url: string
  imgur_page_url: string
  imgur_delete_url: string
  width: number
  height: number
  file_size: number
  mime_type: string
  original_filename: string
  
  // Dados do post
  title?: string
  description?: string
  tags?: string[]
  is_public?: boolean
  
  // Token do usuário para autenticação
  user_token: string
}

/**
 * GET /api/photos/save-feed - Informações sobre a API
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API Save Photo Feed - Orkut BR',
    description: 'Salva posts de fotos Imgur no feed global',
    methods: ['POST'],
    required_fields: [
      'imgur_id', 'imgur_url', 'width', 'height', 'file_size', 
      'original_filename', 'user_token'
    ],
    optional_fields: [
      'title', 'description', 'tags', 'is_public'
    ],
    status: 'online',
    timestamp: new Date().toISOString()
  })
}

/**
 * POST /api/photos/save-feed - Salvar post de foto no feed
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('📸 [Save Feed] Iniciando salvamento de foto no feed')

  try {
    const body: SavePhotoFeedRequest = await request.json()

    // Validar dados obrigatórios
    const requiredFields = [
      'imgur_id', 'imgur_url', 'width', 'height', 
      'file_size', 'original_filename', 'user_token'
    ]

    for (const field of requiredFields) {
      if (!body[field as keyof SavePhotoFeedRequest]) {
        return NextResponse.json({
          success: false,
          error: `Campo obrigatório ausente: ${field}`
        }, { status: 400 })
      }
    }

    // Verificar autenticação via token
    console.log('🔐 [Save Feed] Verificando autenticação...')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(body.user_token)
    
    if (authError || !user) {
      console.error('❌ [Save Feed] Erro de autenticação:', authError)
      return NextResponse.json({
        success: false,
        error: 'Token de usuário inválido ou expirado'
      }, { status: 401 })
    }

    console.log('✅ [Save Feed] Usuário autenticado:', user.email)

    // Preparar dados para inserção
    const photoFeedData = {
      user_id: user.id,
      user_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
      user_avatar: user.user_metadata?.avatar_url || null,
      
      // Dados da imagem
      imgur_id: body.imgur_id,
      imgur_url: body.imgur_url,
      imgur_page_url: body.imgur_page_url || `https://imgur.com/${body.imgur_id}`,
      imgur_delete_url: body.imgur_delete_url || null,
      
      // Metadados da imagem
      width: body.width,
      height: body.height,
      file_size: body.file_size,
      mime_type: body.mime_type || 'image/jpeg',
      original_filename: body.original_filename,
      
      // Dados do post
      title: body.title || body.original_filename,
      description: body.description || null,
      tags: body.tags || [],
      is_public: body.is_public !== false, // default true
      
      // Contadores
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      views_count: 0,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('💾 [Save Feed] Inserindo no banco de dados...')

    // Inserir no banco de dados
    const { data: savedPhoto, error: dbError } = await supabase
      .from('photos_feed')
      .insert(photoFeedData)
      .select(`
        *,
        profiles:user_id (
          name,
          avatar_url,
          username
        )
      `)
      .single()

    if (dbError) {
      console.error('❌ [Save Feed] Erro no banco:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar no banco de dados',
        details: dbError.message
      }, { status: 500 })
    }

    const processingTime = Date.now() - startTime

    console.log('✅ [Save Feed] Foto salva com sucesso:', {
      id: savedPhoto.id,
      user: savedPhoto.user_name,
      title: savedPhoto.title,
      processingTime: `${processingTime}ms`
    })

    return NextResponse.json({
      success: true,
      message: 'Foto salva no feed com sucesso!',
      data: {
        id: savedPhoto.id,
        imgur_url: savedPhoto.imgur_url,
        title: savedPhoto.title,
        user_name: savedPhoto.user_name,
        created_at: savedPhoto.created_at,
        processing_time_ms: processingTime
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    console.error(`❌ [Save Feed] Erro após ${processingTime}ms:`, errorMessage)
    
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
