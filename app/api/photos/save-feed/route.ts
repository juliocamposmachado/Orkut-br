import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

// Cliente Supabase com service role para inserir dados
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Arquivo para armazenar fotos localmente como backup
const PHOTOS_FILE = path.join(process.cwd(), 'data', 'photos-feed.json')

// Função para garantir que a pasta data existe
async function ensureDataDir() {
  const dataDir = path.dirname(PHOTOS_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Função para carregar fotos do arquivo local
async function loadPhotos() {
  try {
    await ensureDataDir()
    const data = await fs.readFile(PHOTOS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Função para salvar fotos no arquivo local
async function savePhotos(photos: any[]) {
  await ensureDataDir()
  await fs.writeFile(PHOTOS_FILE, JSON.stringify(photos, null, 2))
}

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
  
  // Token do usuário para autenticação (opcional para usuários anônimos)
  user_token?: string
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

    // Validar dados obrigatórios (user_token é opcional para usuários anônimos)
    const requiredFields = [
      'imgur_id', 'imgur_url', 'width', 'height', 
      'file_size', 'original_filename'
    ]

    for (const field of requiredFields) {
      if (!body[field as keyof SavePhotoFeedRequest]) {
        return NextResponse.json({
          success: false,
          error: `Campo obrigatório ausente: ${field}`
        }, { status: 400 })
      }
    }

    // Verificar autenticação via token (opcional)
    let user = null
    let isAnonymous = false
    
    if (body.user_token) {
      console.log('🔐 [Save Feed] Verificando autenticação...')
      const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser(body.user_token)
      
      if (authError || !authenticatedUser) {
        console.warn('⚠️ [Save Feed] Token inválido, salvando como anônimo:', authError?.message)
        isAnonymous = true
      } else {
        user = authenticatedUser || null
        console.log('✅ [Save Feed] Usuário autenticado:', user.email)
      }
    } else {
      console.log('👤 [Save Feed] Salvando como usuário anônimo')
      isAnonymous = true
    }

    // Preparar dados para inserção
    const photoFeedData = {
      user_id: (user as any)?.id || null,
      user_name: (user as any)?.user_metadata?.name || (user as any)?.email?.split('@')[0] || 'Usuário Anônimo',
      user_avatar: (user as any)?.user_metadata?.avatar_url || null,
      
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

    console.log('💾 [Save Feed] Tentando salvar no banco de dados...')

    let savedPhoto: any = null
    let usedLocalStorage = false

    // Tentar salvar no banco Supabase primeiro
    try {
      const { data, error: dbError } = await supabase
        .from('photos_feed')
        .insert(photoFeedData)
        .select('*')
        .single()

      if (dbError) {
        throw new Error(`Supabase error: ${dbError.message}`)
      }
      
      savedPhoto = data
      console.log('✅ [Save Feed] Salvo no Supabase com sucesso')
      
    } catch (supabaseError) {
      console.warn('⚠️ [Save Feed] Erro no Supabase, usando armazenamento local:', supabaseError)
      
      // Se Supabase falhar, usar arquivo local como backup
      try {
        const existingPhotos = await loadPhotos()
        
        // Criar ID único para foto
        const timestamp = Date.now()
        const photoId = `local_${timestamp}_${Math.random().toString(36).substring(7)}`
        
        const localPhotoData = {
          ...photoFeedData,
          id: photoId
        }
        
        // Adicionar no início da lista
        existingPhotos.unshift(localPhotoData)
        
        // Manter apenas as últimas 500 fotos
        if (existingPhotos.length > 500) {
          existingPhotos.splice(500)
        }
        
        await savePhotos(existingPhotos)
        
        savedPhoto = localPhotoData
        usedLocalStorage = true
        console.log('✅ [Save Feed] Salvo localmente como backup')
        
      } catch (localError) {
        console.error('❌ [Save Feed] Erro tanto no Supabase quanto no armazenamento local:', localError)
        return NextResponse.json({
          success: false,
          error: 'Erro ao salvar foto (Supabase e local falharam)',
          details: `Supabase: ${supabaseError}; Local: ${localError}`
        }, { status: 500 })
      }
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
      message: usedLocalStorage 
        ? 'Foto salva no feed com sucesso! (armazenamento local como backup)'
        : 'Foto salva no feed com sucesso!',
      data: {
        id: savedPhoto.id,
        imgur_url: savedPhoto.imgur_url,
        title: savedPhoto.title,
        user_name: savedPhoto.user_name,
        created_at: savedPhoto.created_at,
        processing_time_ms: processingTime,
        storage_method: usedLocalStorage ? 'local_backup' : 'supabase'
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
