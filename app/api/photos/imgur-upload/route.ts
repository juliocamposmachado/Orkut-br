import { NextRequest, NextResponse } from 'next/server'

/**
 * API para upload de imagens usando Imgur (sem necessidade de login)
 * Imgur permite uploads anônimos usando Client ID público
 */

// Client ID público do Imgur - pode ser usado sem autenticação para uploads anônimos
const IMGUR_CLIENT_ID = '546c25a59c58ad7'

interface ImgurResponse {
  success: boolean
  status: number
  data?: {
    id: string
    title?: string
    description?: string
    datetime: number
    type: string
    animated: boolean
    width: number
    height: number
    size: number
    views: number
    bandwidth: number
    vote?: any
    favorite: boolean
    nsfw?: boolean
    section?: string
    account_url?: string
    account_id?: number
    is_ad: boolean
    in_most_viral: boolean
    has_sound: boolean
    tags: any[]
    ad_type: number
    ad_url: string
    edited: string
    in_gallery: boolean
    deletehash: string
    name: string
    link: string // URL direta da imagem
  }
  error?: {
    message: string
    type: string
    exception: any
  }
}

/**
 * GET /api/photos/imgur-upload - Informações sobre a API
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API Upload Imgur - Orkut BR',
    description: 'Upload anônimo de fotos usando Imgur (sem login necessário)',
    methods: ['POST'],
    features: [
      'Upload anônimo sem login',
      'Suporte a JPEG, PNG, GIF, WebP',
      'Máximo 10MB por imagem',
      'Links diretos funcionais',
      'API pública e confiável'
    ],
    limits: {
      max_file_size: '10MB',
      supported_formats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      rate_limit: '1250 uploads por dia'
    },
    status: 'online',
    timestamp: new Date().toISOString()
  })
}

/**
 * POST /api/photos/imgur-upload - Upload para Imgur
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🎨 [Imgur] Iniciando upload para Imgur.com')

  try {
    // Parse do FormData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum arquivo enviado'
      }, { status: 400 })
    }

    // Validações
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB (máximo 10MB)`
      }, { status: 413 })
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json({
        success: false,
        error: `Tipo não suportado: ${file.type}. Permitidos: ${allowedTypes.join(', ')}`
      }, { status: 415 })
    }

    console.log('📁 [Imgur] Arquivo validado:', {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)}KB`,
      type: file.type
    })

    // Converter arquivo para base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Preparar dados para Imgur
    const imgurFormData = new FormData()
    imgurFormData.append('image', base64)
    imgurFormData.append('type', 'base64')
    imgurFormData.append('title', file.name)
    imgurFormData.append('description', `Foto enviada pelo Orkut BR em ${new Date().toLocaleString('pt-BR')}`)

    // Headers para Imgur API
    const headers = {
      'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
      'Accept': 'application/json'
    }

    console.log('📤 [Imgur] Enviando para Imgur API...')

    // Fazer upload para Imgur com timeout
    const response = await Promise.race([
      fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers,
        body: imgurFormData
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout no upload (30s)')), 30000)
      )
    ])

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [Imgur] Erro HTTP:', response.status, errorText)
      
      return NextResponse.json({
        success: false,
        error: `Erro do Imgur: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: 502 })
    }

    const result: ImgurResponse = await response.json()

    if (!result.success || !result.data) {
      console.error('❌ [Imgur] Upload falhou:', result.error)
      
      return NextResponse.json({
        success: false,
        error: 'Falha no upload para Imgur',
        details: result.error?.message || 'Resposta inválida do Imgur'
      }, { status: 502 })
    }

    // Upload bem-sucedido!
    const processingTime = Date.now() - startTime
    const imageData = result.data

    console.log('✅ [Imgur] Upload bem-sucedido:', {
      id: imageData.id,
      link: imageData.link,
      size: `${(imageData.size / 1024).toFixed(2)}KB`,
      processingTime: `${processingTime}ms`
    })

    return NextResponse.json({
      success: true,
      message: 'Upload realizado com sucesso no Imgur',
      data: {
        id: imageData.id,
        url: imageData.link,
        direct_url: imageData.link,
        page_url: `https://imgur.com/${imageData.id}`,
        thumbnail_url: imageData.link.replace(/\.(jpg|jpeg|png|gif|webp)$/i, 't.$1'),
        delete_url: `https://imgur.com/delete/${imageData.deletehash}`,
        width: imageData.width,
        height: imageData.height,
        file_size: imageData.size,
        mime_type: imageData.type,
        original_filename: file.name,
        upload_service: 'imgur',
        upload_time: new Date().toISOString(),
        processing_time_ms: processingTime,
        // Links extras para diferentes usos
        links: {
          direct: imageData.link,
          page: `https://imgur.com/${imageData.id}`,
          thumbnail: imageData.link.replace(/\.(jpg|jpeg|png|gif|webp)$/i, 't.$1'),
          delete: `https://imgur.com/delete/${imageData.deletehash}`
        }
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    console.error(`❌ [Imgur] Erro após ${processingTime}ms:`, errorMessage)
    
    return NextResponse.json({
      success: false,
      error: 'Erro no upload para Imgur',
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
