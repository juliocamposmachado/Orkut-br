import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Cliente Supabase para servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se as variáveis estão configuradas
const isSupabaseConfigured = !!(supabaseUrl && 
  supabaseServiceKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your_'))

// Criar cliente Supabase
const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null

/**
 * GET /api/photos/postimage - Informações sobre a API
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API de PostImage - Orkut BR',
    methods: ['POST'],
    description: 'Endpoint para salvar fotos hospedadas no PostImage.org',
    requiresAuth: true,
    timestamp: new Date().toISOString()
  })
}

/**
 * POST /api/photos/postimage - Salvar foto hospedada no PostImage.org
 */
export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/photos/postimage chamado')
  
  try {
    // Se Supabase não estiver configurado, retornar erro informativo
    if (!supabase) {
      console.error('❌ Supabase não configurado')
      return NextResponse.json({ 
        success: false,
        error: 'Funcionalidade não disponível no momento',
        message: 'O servidor não está configurado para salvar fotos.',
        demo: true
      }, { status: 503 })
    }

    // Verificar autenticação via header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Token de autorização necessário'
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Se for um token mock (para desenvolvimento), criar usuário temporário
    let user: any
    if (token === 'mock-token') {
      user = {
        id: 'mock-user-id',
        email: 'user@example.com'
      }
      console.log('🧪 Usando mock user para desenvolvimento')
    } else {
      // Criar cliente supabase temporário para verificar o token
      const tempSupabase = createClient(supabaseUrl!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
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
      
      // Verificar se o token é válido
      const { data: userData, error: authError } = await tempSupabase.auth.getUser()
      
      if (authError || !userData.user) {
        return NextResponse.json({ 
          error: 'Token inválido ou expirado'
        }, { status: 401 })
      }
      
      user = userData.user
    }
    
    console.log('✅ Usuário autenticado:', user.email)

    // Parse do JSON body
    let body: any
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ 
        error: 'Dados JSON inválidos' 
      }, { status: 400 })
    }
    
    // Validar dados obrigatórios
    const { url, thumbnail_url, page_url, title, description, category, filename, filesize, mime_type } = body
    
    if (!url || !title) {
      return NextResponse.json({ 
        error: 'URL da imagem e título são obrigatórios' 
      }, { status: 400 })
    }

    const photoId = uuidv4()
    
    // Inserir registro no banco de dados
    console.log('📸 Inserindo foto no banco:', {
      photoId,
      userId: user.id,
      title,
      url,
      source: 'postimage'
    })
    
    const { data: photoRecord, error: dbError } = await supabase
      .from('user_photos')
      .insert({
        id: photoId,
        user_id: user.id,
        url: url, // URL direta da imagem no PostImage
        preview_url: url, // Mesma URL para preview
        thumbnail_url: thumbnail_url || url, // URL do thumbnail ou a mesma URL
        title: title,
        description: description || null,
        category: category || 'geral',
        file_size: filesize || 0,
        width: 0, // PostImage não retorna dimensões por padrão
        height: 0,
        mime_type: mime_type || 'image/jpeg',
        file_path: url, // Usar a URL como file_path
        is_public: true, // Fotos do PostImage são sempre públicas
        is_processed: true,
        is_deleted: false,
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        // Campos específicos do PostImage
        external_url: page_url, // URL da página no PostImage
        external_service: 'postimage',
        original_filename: filename || null
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erro no banco:', dbError)
      throw new Error(`Erro no banco: ${dbError.message}`)
    }

    console.log('✅ Foto salva com sucesso:', photoRecord.id)

    return NextResponse.json({
      success: true,
      message: 'Foto salva com sucesso',
      data: photoRecord
    })

  } catch (error) {
    console.error('Erro ao salvar foto do PostImage:', error)
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
