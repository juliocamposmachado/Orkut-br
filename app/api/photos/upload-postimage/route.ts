import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/photos/upload-postimage - Informações sobre a API
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API Proxy PostImage - Orkut BR',
    methods: ['POST'],
    description: 'Endpoint proxy para upload no PostImage.org sem problemas de CORS',
    timestamp: new Date().toISOString()
  })
}

/**
 * POST /api/photos/upload-postimage - Proxy para upload no PostImage.org
 */
export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/photos/upload-postimage chamado')
  
  try {
    // Parse do FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const resize = formData.get('resize') as string || '320x240'
    const expire = formData.get('expire') as string || '0'
    
    if (!file) {
      return NextResponse.json({ 
        success: false,
        error: 'Nenhum arquivo enviado' 
      }, { status: 400 })
    }

    console.log('📄 Arquivo recebido:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Preparar FormData para PostImage
    const postImageFormData = new FormData()
    postImageFormData.append('upload', file)
    postImageFormData.append('type', 'file')
    postImageFormData.append('resize', resize)
    postImageFormData.append('expire', expire)

    console.log('📤 Enviando para PostImage.org...')
    
    // Fazer upload para PostImage.org
    const response = await fetch('https://postimages.org/json/rr', {
      method: 'POST',
      body: postImageFormData,
      headers: {
        'User-Agent': 'Orkut-BR-Upload/1.0'
      }
    })

    if (!response.ok) {
      console.error('❌ Erro HTTP do PostImage:', response.status, response.statusText)
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const responseText = await response.text()
    console.log('📥 Resposta do PostImage (raw):', responseText.substring(0, 200))
    
    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta:', parseError)
      throw new Error('Resposta inválida do PostImage')
    }

    console.log('📊 Resultado do PostImage:', result)

    if (result.status === 'OK') {
      return NextResponse.json({
        success: true,
        message: 'Upload realizado com sucesso',
        data: {
          page_url: result.url,
          direct_url: result.direct_url,
          thumb_url: result.thumb_url || result.direct_url,
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type
        }
      })
    } else {
      console.error('❌ PostImage retornou erro:', result)
      return NextResponse.json({
        success: false,
        error: result.message || 'Erro no upload para PostImage'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Erro no proxy PostImage:', error)
    return NextResponse.json(
      { 
        success: false,
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
