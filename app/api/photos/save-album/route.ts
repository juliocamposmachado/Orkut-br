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

interface SaveAlbumPhotoRequest {
  // Link do Imgur (obrigatório)
  imgur_link: string
  
  // Dados opcionais da foto
  titulo?: string
  descricao?: string
  is_public?: boolean
  
  // Token do usuário para autenticação
  user_token?: string
}

/**
 * GET /api/photos/save-album - Informações sobre a API
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API Save Album Photo - Orkut BR',
    description: 'Salva links das fotos do Imgur na tabela album_fotos do usuário',
    methods: ['POST'],
    required_fields: ['imgur_link'],
    optional_fields: ['titulo', 'descricao', 'is_public', 'user_token'],
    status: 'online',
    timestamp: new Date().toISOString()
  })
}

/**
 * POST /api/photos/save-album - Salvar foto no álbum do usuário
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('📸 [Save Album] Iniciando salvamento de foto no álbum')

  try {
    const body: SaveAlbumPhotoRequest = await request.json()

    // Validar dados obrigatórios
    if (!body.imgur_link) {
      return NextResponse.json({
        success: false,
        error: 'Campo obrigatório ausente: imgur_link'
      }, { status: 400 })
    }

    // Validar formato do link do Imgur
    if (!body.imgur_link.includes('imgur.com') && !body.imgur_link.includes('i.imgur.com')) {
      return NextResponse.json({
        success: false,
        error: 'Link deve ser do Imgur (imgur.com ou i.imgur.com)'
      }, { status: 400 })
    }

    // Verificar autenticação via token
    let user = null
    
    if (body.user_token) {
      console.log('🔐 [Save Album] Verificando autenticação...')
      const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser(body.user_token)
      
      if (authError || !authenticatedUser) {
        console.warn('⚠️ [Save Album] Token inválido:', authError?.message)
        return NextResponse.json({
          success: false,
          error: 'Token de autenticação inválido. Faça login para salvar no seu álbum.'
        }, { status: 401 })
      }
      
      user = authenticatedUser
      console.log('✅ [Save Album] Usuário autenticado:', user.email)
    } else {
      return NextResponse.json({
        success: false,
        error: 'É necessário estar logado para salvar no álbum pessoal. Forneça um user_token válido.'
      }, { status: 401 })
    }

    // Verificar se o link já existe para este usuário
    const { data: existingPhoto, error: checkError } = await supabase
      .from('album_fotos')
      .select('id')
      .eq('user_id', user.id)
      .eq('imgur_link', body.imgur_link)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = nenhuma linha encontrada
      console.error('❌ [Save Album] Erro ao verificar duplicata:', checkError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao verificar duplicatas no banco de dados',
        details: checkError.message
      }, { status: 500 })
    }

    if (existingPhoto) {
      console.log('⚠️ [Save Album] Foto já existe no álbum do usuário')
      return NextResponse.json({
        success: false,
        error: 'Esta foto já está salva no seu álbum!'
      }, { status: 409 })
    }

    // Preparar dados para inserção
    const albumPhotoData = {
      user_id: user.id,
      imgur_link: body.imgur_link,
      titulo: body.titulo || 'Nova foto',
      descricao: body.descricao || '',
      is_public: body.is_public !== false, // default true
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('💾 [Save Album] Inserindo na tabela album_fotos...')

    // Inserir no banco de dados
    const { data: savedPhoto, error: dbError } = await supabase
      .from('album_fotos')
      .insert(albumPhotoData)
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          photo_url
        )
      `)
      .single()

    if (dbError) {
      console.error('❌ [Save Album] Erro no banco:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar no álbum',
        details: dbError.message
      }, { status: 500 })
    }

    const processingTime = Date.now() - startTime

    console.log('✅ [Save Album] Foto salva no álbum com sucesso:', {
      id: savedPhoto.id,
      user: user.email,
      titulo: savedPhoto.titulo,
      processingTime: `${processingTime}ms`
    })

    return NextResponse.json({
      success: true,
      message: 'Foto salva no seu álbum com sucesso!',
      data: {
        id: savedPhoto.id,
        imgur_link: savedPhoto.imgur_link,
        titulo: savedPhoto.titulo,
        descricao: savedPhoto.descricao,
        is_public: savedPhoto.is_public,
        created_at: savedPhoto.created_at,
        user_info: savedPhoto.profiles,
        processing_time_ms: processingTime
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    console.error(`❌ [Save Album] Erro após ${processingTime}ms:`, errorMessage)
    
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
