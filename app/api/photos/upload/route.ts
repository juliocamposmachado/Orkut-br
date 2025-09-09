import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

// Cliente Supabase para servidor - Configuração para Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Log para debug em desenvolvimento (não em produção)
if (process.env.NODE_ENV !== 'production') {
  console.log('🔧 Debug Supabase Config:')
  console.log('- URL:', supabaseUrl ? '✅ Configurada' : '❌ Não encontrada')
  console.log('- Service Key:', supabaseServiceKey ? '✅ Configurada' : '❌ Não encontrada')
  console.log('- Environment:', process.env.NODE_ENV)
}

// Verificar se as variáveis estão configuradas (melhorada para Vercel)
const isSupabaseConfigured = !!(supabaseUrl && 
  supabaseServiceKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your_'))

if (!isSupabaseConfigured && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️ Supabase não configurado completamente para upload')
  console.warn('Verifique as variáveis de ambiente no Vercel:')
  console.warn('- NEXT_PUBLIC_SUPABASE_URL')
  console.warn('- SUPABASE_SERVICE_ROLE_KEY')
}

// Criar cliente Supabase
const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false, // Importante para APIs
        autoRefreshToken: false
      }
    })
  : null

interface UploadResult {
  success: boolean
  data?: {
    id: string
    url: string
    thumbnailUrl: string
    previewUrl: string
  }
  error?: string
}

// Configurações de otimização
const SIZES = {
  ORIGINAL: { width: 1920, height: 1080, quality: 85 },
  PREVIEW: { width: 800, height: 600, quality: 80 },
  THUMBNAIL: { width: 300, height: 300, quality: 75 }
}

/**
 * Comprime e redimensiona imagem usando Sharp
 */
async function processImage(
  buffer: Buffer, 
  config: { width: number; height: number; quality: number }
): Promise<Buffer> {
  return await sharp(buffer)
    .resize(config.width, config.height, {
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: config.quality })
    .toBuffer()
}

/**
 * Valida arquivo de imagem
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Validar tipo de arquivo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou HEIC.' }
  }

  // Validar tamanho (max 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: 'Arquivo muito grande. Máximo 10MB permitido.' }
  }

  return { valid: true }
}

/**
 * Upload otimizado de foto
 */
/**
 * GET /api/photos/upload - Informações sobre a API de upload
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API de Upload de Fotos - Orkut BR',
    methods: ['POST'],
    description: 'Endpoint para upload de fotos. Use método POST com FormData.',
    maxFileSize: '10MB',
    supportedFormats: ['JPEG', 'PNG', 'WebP', 'HEIC'],
    requiresAuth: true,
    timestamp: new Date().toISOString()
  })
}

/**
 * OPTIONS /api/photos/upload - CORS preflight
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

/**
 * POST /api/photos/upload - Upload otimizado de foto
 */
export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/photos/upload chamado')
  
  try {
    // Log das configurações do Supabase (sem expor secrets)
    console.log('🔧 Configuração Supabase:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      isConfigured: isSupabaseConfigured,
      supabaseExists: !!supabase
    })

    // Se Supabase não estiver configurado, retornar erro informativo
    if (!supabase) {
      console.error('❌ Supabase não configurado para upload de fotos')
      return NextResponse.json({ 
        success: false,
        error: 'Funcionalidade de upload de fotos não disponível no momento',
        message: 'O servidor não está configurado para upload de fotos. Entre em contato com o administrador.',
        demo: true,
        details: 'Supabase URL ou Service Key não configurados corretamente'
      }, { status: 503 })
    }

    console.log('✅ Iniciando upload de fotos...')

    // Verificar autenticação via header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Header de autenticação ausente ou inválido')
      return NextResponse.json({ 
        error: 'Token de autorização necessário',
        details: 'Cabeçalho Authorization com Bearer token é obrigatório'
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('Token recebido:', token.substring(0, 20) + '...')
    
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
    const { data: { user }, error: authError } = await tempSupabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Erro de autenticação no upload:', authError)
      return NextResponse.json({ 
        error: 'Token inválido ou expirado',
        details: authError?.message || 'Token não pôde ser validado'
      }, { status: 401 })
    }
    
    console.log('Usuário autenticado:', user.email)

    // Parse do FormData com melhor tratamento de erros
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      console.error('Erro ao fazer parse do FormData:', error)
      return NextResponse.json({ error: 'Dados do formulário inválidos' }, { status: 400 })
    }
    
    // Suportar tanto 'file' quanto 'files' (retrocompatibilidade)
    let files: File[] = []
    const singleFile = formData.get('file') as File
    const multipleFiles = formData.getAll('files') as File[]
    
    if (singleFile && singleFile instanceof File && singleFile.size > 0) {
      files = [singleFile]
    } else if (multipleFiles.length > 0) {
      files = multipleFiles.filter(f => f instanceof File && f.size > 0)
    }
    
    const title = (formData.get('title') as string) || `Foto ${new Date().toLocaleDateString('pt-BR')}`
    const description = (formData.get('description') as string) || ''
    const category = (formData.get('category') as string) || 'geral'
    const isPublic = (formData.get('isPublic') as string) !== 'false' // padrão true

    if (files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Processar múltiplos arquivos
    const results: UploadResult[] = []

    for (const file of files) {
      try {
        // Validar arquivo
        const validation = validateImageFile(file)
        if (!validation.valid) {
          results.push({ success: false, error: validation.error })
          continue
        }

        // Converter arquivo para buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        const photoId = uuidv4()
        const timestamp = Date.now()
        
        // Gerar nomes únicos para os arquivos
        const basePath = `photos/${user.id}/${timestamp}_${photoId}`
        const originalPath = `${basePath}_original.webp`
        const previewPath = `${basePath}_preview.webp`
        const thumbnailPath = `${basePath}_thumb.webp`

        // Processar imagens em diferentes tamanhos
        const [originalBuffer, previewBuffer, thumbnailBuffer] = await Promise.all([
          processImage(fileBuffer, SIZES.ORIGINAL),
          processImage(fileBuffer, SIZES.PREVIEW),
          processImage(fileBuffer, SIZES.THUMBNAIL)
        ])

        // Upload paralelo das 3 versões
        const [originalUpload, previewUpload, thumbnailUpload] = await Promise.all([
          supabase.storage.from('user-photos').upload(originalPath, originalBuffer, {
            contentType: 'image/webp',
            upsert: false
          }),
          supabase.storage.from('user-photos').upload(previewPath, previewBuffer, {
            contentType: 'image/webp', 
            upsert: false
          }),
          supabase.storage.from('user-photos').upload(thumbnailPath, thumbnailBuffer, {
            contentType: 'image/webp',
            upsert: false
          })
        ])

        // Verificar erros de upload
        if (originalUpload.error || previewUpload.error || thumbnailUpload.error) {
          const errors = [
            originalUpload.error && `Original: ${originalUpload.error.message}`,
            previewUpload.error && `Preview: ${previewUpload.error.message}`,
            thumbnailUpload.error && `Thumbnail: ${thumbnailUpload.error.message}`
          ].filter(Boolean).join(', ')
          
          console.error('Erro no upload para storage:', errors)
          throw new Error(`Erro no upload para storage: ${errors}`)
        }

        // Gerar URLs públicas
        const { data: { publicUrl: originalUrl } } = supabase.storage
          .from('user-photos').getPublicUrl(originalPath)
        
        const { data: { publicUrl: previewUrl } } = supabase.storage
          .from('user-photos').getPublicUrl(previewPath)
          
        const { data: { publicUrl: thumbnailUrl } } = supabase.storage
          .from('user-photos').getPublicUrl(thumbnailPath)

        // Obter dimensões da imagem original usando Sharp
        const metadata = await sharp(fileBuffer).metadata()

        // Inserir registro no banco de dados usando Service Role para bypass RLS
        console.log('📸 Inserindo foto no banco:', {
          photoId,
          userId: user.id,
          title: title || `Foto ${timestamp}`,
          isPublic,
          fileSize: originalBuffer.length
        })
        
        const { data: photoRecord, error: dbError } = await supabase
          .from('user_photos')
          .insert({
            id: photoId,
            user_id: user.id,
            url: originalUrl,
            preview_url: previewUrl,
            thumbnail_url: thumbnailUrl,
            title: title || `Foto ${timestamp}`,
            description: description || null,
            category: category || null,
            file_size: originalBuffer.length,
            width: metadata.width || 0,
            height: metadata.height || 0,
            mime_type: 'image/webp',
            file_path: originalPath,
            is_public: isPublic,
            is_processed: true,
            is_deleted: false,
            likes_count: 0,
            comments_count: 0,
            views_count: 0
          })
          .select()
          .single()

        if (dbError) {
          // Limpar arquivos do storage se erro no banco
          await Promise.all([
            supabase.storage.from('user-photos').remove([originalPath]),
            supabase.storage.from('user-photos').remove([previewPath]),
            supabase.storage.from('user-photos').remove([thumbnailPath])
          ])
          throw new Error(`Erro no banco: ${dbError.message}`)
        }

        // ✨ REMOVER FOTOS DE EXEMPLO APÓS PRIMEIRO UPLOAD REAL
        // Verificar se este é o primeiro upload real do usuário
        const { data: userPhotosCount } = await supabase
          .from('user_photos')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .not('title', 'like', '%[EXEMPLO]%')

        // Se esta é a primeira foto real, remover todas as fotos de exemplo
        if (userPhotosCount?.length === 1) {
          const { error: deleteExamplesError } = await supabase
            .from('user_photos')
            .delete()
            .like('title', '%[EXEMPLO]%')
            
          if (!deleteExamplesError) {
            console.log('Fotos de exemplo removidas após primeiro upload real')
          }
        }

        results.push({
          success: true,
          data: {
            id: photoId,
            url: originalUrl,
            thumbnailUrl,
            previewUrl
          }
        })

      } catch (error) {
        console.error('Erro processando arquivo:', error)
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    // Retornar resultados
    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Upload concluído: ${successCount} sucesso(s), ${errorCount} erro(s)`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error('Erro no upload de fotos:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
