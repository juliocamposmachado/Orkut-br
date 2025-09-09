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
    // Parse do FormData com timeout
    const formData = await Promise.race([
      request.formData(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao processar FormData')), 10000)
      )
    ]) as FormData
    
    const file = formData.get('file') as File
    
    if (!file) {
      console.error('❌ Nenhum arquivo no FormData')
      return NextResponse.json({ 
        success: false,
        error: 'Nenhum arquivo enviado' 
      }, { status: 400 })
    }

    // Validar arquivo
    if (file.size > 32 * 1024 * 1024) { // 32MB
      return NextResponse.json({
        success: false,
        error: 'Arquivo muito grande (máximo 32MB)'
      }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        error: 'Apenas arquivos de imagem são permitidos'
      }, { status: 400 })
    }

    console.log('📄 Arquivo validado:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Preparar FormData para PostImage.org (usando endpoint correto)
    const postImageFormData = new FormData()
    postImageFormData.append('upload', file, file.name)
    postImageFormData.append('optsize', '0') // Sem redimensionamento
    postImageFormData.append('expire', '0') // Sem expiração
    postImageFormData.append('adult', 'no')

    console.log('📤 Enviando para PostImage.org...')
    
    // Upload com timeout e retry
    let response
    let attempts = 0
    const maxAttempts = 2
    
    while (attempts < maxAttempts) {
      try {
        response = await Promise.race([
          fetch('https://postimages.org/', {
            method: 'POST',
            body: postImageFormData,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout na requisição')), 30000)
          )
        ]) as Response
        
        break
      } catch (error) {
        attempts++
        console.warn(`⚠️ Tentativa ${attempts} falhou:`, error)
        if (attempts >= maxAttempts) throw error
        await new Promise(resolve => setTimeout(resolve, 1000)) // Aguardar 1s
      }
    }

    if (!response.ok) {
      console.error('❌ Erro HTTP do PostImage:', response.status, response.statusText)
      return NextResponse.json({
        success: false,
        error: `Erro do PostImage: ${response.status} ${response.statusText}`
      }, { status: 502 })
    }

    const responseText = await response.text()
    console.log('📥 Resposta recebida, tamanho:', responseText.length)
    
    // Extrair URLs da resposta HTML
    const directUrlMatch = responseText.match(/https:\/\/i\.postimg\.cc\/[a-zA-Z0-9\/]+\.[a-zA-Z]{3,4}/)
    const pageUrlMatch = responseText.match(/https:\/\/postimg\.cc\/[a-zA-Z0-9]+/)
    
    if (directUrlMatch) {
      const directUrl = directUrlMatch[0]
      const pageUrl = pageUrlMatch ? pageUrlMatch[0] : directUrl
      
      console.log('✅ URLs extraídas:', { directUrl, pageUrl })
      
      return NextResponse.json({
        success: true,
        message: 'Upload realizado com sucesso',
        data: {
          direct_url: directUrl,
          page_url: pageUrl,
          thumb_url: directUrl, // PostImage geralmente serve a mesma URL
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type
        }
      })
    } else {
      console.error('❌ Não foi possível extrair URLs da resposta')
      return NextResponse.json({
        success: false,
        error: 'Erro ao processar resposta do PostImage'
      }, { status: 502 })
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
