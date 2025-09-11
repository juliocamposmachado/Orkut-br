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

interface SaveUserPhotoRequest {
  // Dados da imagem Imgur
  imgur_id: string
  imgur_url: string
  imgur_page_url: string
  imgur_delete_url?: string
  width: number
  height: number
  file_size: number
  mime_type: string
  original_filename: string
  
  // Dados do post
  title?: string
  description?: string
  category?: string
  is_public?: boolean
  
  // Token do usuário para autenticação (obrigatório para user_photos)
  user_token: string
}

/**
 * GET /api/photos/save-user-photo - Informações sobre a API
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API Save User Photo - Orkut BR',
    description: 'Salva fotos do Imgur na galeria pessoal do usuário (tabela user_photos)',
    methods: ['POST'],
    required_fields: [
      'imgur_id', 'imgur_url', 'width', 'height', 'file_size', 
      'original_filename', 'user_token'
    ],
    optional_fields: [
      'title', 'description', 'category', 'is_public'
    ],
    status: 'online',
    timestamp: new Date().toISOString()
  })
}

/**
 * POST /api/photos/save-user-photo - Salvar foto na galeria do usuário
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('📸 [Save User Photo] Iniciando salvamento na galeria pessoal')

  try {
    const body: SaveUserPhotoRequest = await request.json()

    // Validar dados obrigatórios
    const requiredFields = [
      'imgur_id', 'imgur_url', 'width', 'height', 
      'file_size', 'original_filename', 'user_token'
    ]

    for (const field of requiredFields) {
      if (!body[field as keyof SaveUserPhotoRequest]) {
        return NextResponse.json({
          success: false,
          error: `Campo obrigatório ausente: ${field}`
        }, { status: 400 })
      }
    }

    // Verificar autenticação via token (obrigatório para user_photos)
    console.log('🔐 [Save User Photo] Verificando autenticação...')
    const { data: { user }, error: authError } = await supabase.auth.getUser(body.user_token)
    
    if (authError || !user) {
      console.error('❌ [Save User Photo] Erro de autenticação:', authError)
      return NextResponse.json({
        success: false,
        error: 'Token de usuário inválido ou expirado. Login obrigatório para salvar na galeria.'
      }, { status: 401 })
    }

    console.log('✅ [Save User Photo] Usuário autenticado:', user.email)

    // Verificar se a foto já existe na galeria do usuário
    const { data: existingPhoto } = await supabase
      .from('user_photos')
      .select('id')
      .eq('user_id', user.id)
      .eq('url', body.imgur_url)
      .single()

    if (existingPhoto) {
      return NextResponse.json({
        success: false,
        error: 'Esta foto já existe em sua galeria',
        data: { id: existingPhoto.id }
      }, { status: 409 })
    }

    // Preparar dados para inserção na tabela user_photos
    const userPhotoData = {
      user_id: user.id,
      url: body.imgur_url,
      preview_url: body.imgur_url.replace('.jpg', 'm.jpg').replace('.png', 'm.png'),
      thumbnail_url: body.imgur_url.replace('.jpg', 's.jpg').replace('.png', 's.png'),
      title: body.title || body.original_filename,
      description: body.description || null,
      category: body.category || 'imgur',
      file_size: body.file_size,
      width: body.width,
      height: body.height,
      mime_type: body.mime_type || 'image/jpeg',
      file_path: `imgur/${body.imgur_id}`,
      is_public: body.is_public !== false, // default true
      is_processed: true, // Imgur já processou
      is_deleted: false,
      likes_count: 0,
      comments_count: 0,
      views_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('💾 [Save User Photo] Inserindo na tabela user_photos...')

    // Inserir no banco de dados
    const { data: savedPhoto, error: dbError } = await supabase
      .from('user_photos')
      .insert(userPhotoData)
      .select('*')
      .single()

    if (dbError) {
      console.error('❌ [Save User Photo] Erro no banco:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar na galeria pessoal',
        details: dbError.message
      }, { status: 500 })
    }

    const processingTime = Date.now() - startTime

    console.log('✅ [Save User Photo] Foto salva na galeria:', {
      id: savedPhoto.id,
      user: user.email,
      title: savedPhoto.title,
      processingTime: `${processingTime}ms`
    })

    return NextResponse.json({
      success: true,
      message: 'Foto salva na galeria pessoal com sucesso!',
      data: {
        id: savedPhoto.id,
        url: savedPhoto.url,
        title: savedPhoto.title,
        user_id: savedPhoto.user_id,
        created_at: savedPhoto.created_at,
        processing_time_ms: processingTime
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    console.error(`❌ [Save User Photo] Erro após ${processingTime}ms:`, errorMessage)
    
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
