import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/photos/postimage-official - Informações sobre a API
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API PostImage Oficial - Orkut BR',
    methods: ['POST'],
    description: 'Endpoint que usa o site oficial do PostImage.org para uploads',
    status: 'online',
    features: [
      'Upload via site oficial',
      'Captura automática de links',
      'Suporte a múltiplos formatos',
      'Links diretos e de página'
    ],
    timestamp: new Date().toISOString()
  })
}

/**
 * POST /api/photos/postimage-official - Upload usando site oficial do PostImage
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🌐 [PostImage Official] Iniciando upload via site oficial')
  
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

    // Validações básicas
    if (file.size > 32 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo muito grande (máximo 32MB)'
      }, { status: 413 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        error: 'Apenas imagens são permitidas'
      }, { status: 415 })
    }

    console.log('📁 [PostImage Official] Arquivo validado:', {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)}KB`,
      type: file.type
    })

    // Converter arquivo para base64 para processar
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Simular upload usando fetch para o endpoint oficial
    const uploadResult = await uploadToPostImageOfficial(buffer, file.name, file.type)
    
    if (uploadResult.success) {
      console.log('✅ [PostImage Official] Upload bem-sucedido:', {
        directUrl: uploadResult.directUrl,
        pageUrl: uploadResult.pageUrl,
        processingTime: `${Date.now() - startTime}ms`
      })

      return NextResponse.json({
        success: true,
        message: 'Upload realizado com sucesso via site oficial',
        data: {
          direct_url: uploadResult.directUrl,
          page_url: uploadResult.pageUrl,
          thumb_url: uploadResult.directUrl,
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          upload_method: 'official_site',
          processing_time_ms: Date.now() - startTime
        }
      })
    } else {
      throw new Error(uploadResult.error || 'Falha no upload oficial')
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`❌ [PostImage Official] Erro após ${processingTime}ms:`, error)

    return NextResponse.json({
      success: false,
      error: 'Erro no upload via site oficial',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      processing_time_ms: processingTime
    }, { status: 500 })
  }
}

/**
 * Função para fazer upload usando o site oficial do PostImage
 */
async function uploadToPostImageOfficial(
  buffer: Buffer, 
  filename: string, 
  mimeType: string
): Promise<{
  success: boolean
  directUrl?: string
  pageUrl?: string
  error?: string
}> {
  try {
    console.log('🚀 [Upload Official] Iniciando upload oficial para PostImage.org')
    
    // Criar FormData para enviar para o endpoint oficial
    const formData = new FormData()
    
    // Criar blob do buffer
    const blob = new Blob([buffer], { type: mimeType })
    formData.append('upload', blob, filename)
    formData.append('optsize', '0') // Tamanho original
    formData.append('expire', '0')  // Sem expiração
    formData.append('adult', 'no')  // Conteúdo não adulto
    
    // Headers que simulam um navegador real
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin'
    }

    // Fazer o upload usando o endpoint oficial
    console.log('📤 [Upload Official] Enviando para https://postimages.org/')
    
    const response = await fetch('https://postimages.org/', {
      method: 'POST',
      body: formData,
      headers
    })

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`)
    }

    const responseText = await response.text()
    console.log('📥 [Upload Official] Resposta recebida:', responseText.length, 'caracteres')

    // Extrair URLs da resposta usando múltiplas estratégias
    const extractedUrls = extractUrlsFromResponse(responseText)
    
    if (extractedUrls.directUrl) {
      return {
        success: true,
        directUrl: extractedUrls.directUrl,
        pageUrl: extractedUrls.pageUrl || extractedUrls.directUrl
      }
    } else {
      console.error('❌ [Upload Official] Não foi possível extrair URLs da resposta')
      console.log('📋 [Upload Official] Primeiros 500 caracteres:', responseText.substring(0, 500))
      
      return {
        success: false,
        error: 'Não foi possível extrair URLs da resposta do PostImage'
      }
    }

  } catch (error) {
    console.error('❌ [Upload Official] Erro no upload oficial:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido no upload oficial'
    }
  }
}

/**
 * Extrair URLs da resposta HTML do PostImage
 */
function extractUrlsFromResponse(html: string): {
  directUrl?: string
  pageUrl?: string
} {
  // Estratégias múltiplas para extrair URLs
  const strategies = [
    // URLs diretas i.postimg.cc
    /https?:\/\/i\.postimg\.cc\/[a-zA-Z0-9\/\-_\.]+\.(jpg|jpeg|png|gif|webp|bmp)/gi,
    // URLs de página postimg.cc
    /https?:\/\/postimg\.cc\/[a-zA-Z0-9\/\-_]+/gi,
    // URLs em campos input value
    /value=["']?(https?:\/\/[^"'\s>]+)["']?/gi,
    // URLs em elementos img src
    /src=["']?(https?:\/\/[^"'\s>]+\.(jpg|jpeg|png|gif|webp|bmp))["']?/gi,
    // URLs em links href
    /href=["']?(https?:\/\/[^"'\s>]+)["']?/gi
  ]

  let directUrl: string | undefined
  let pageUrl: string | undefined

  for (const regex of strategies) {
    const matches = Array.from(html.matchAll(regex))
    
    for (const match of matches) {
      const url = match[1] || match[0]
      
      if (url.includes('i.postimg.cc') && !directUrl) {
        directUrl = url
      } else if (url.includes('postimg.cc') && !url.includes('i.postimg.cc') && !pageUrl) {
        pageUrl = url
      }
      
      // Se encontramos ambos, podemos parar
      if (directUrl && pageUrl) break
    }
    
    if (directUrl && pageUrl) break
  }

  // Se não encontrou pageUrl mas tem directUrl, derivar pageUrl
  if (directUrl && !pageUrl) {
    const match = directUrl.match(/\/([a-zA-Z0-9]+)\.[a-zA-Z]+$/)
    if (match) {
      pageUrl = `https://postimg.cc/${match[1]}`
    }
  }

  console.log('🔍 [URL Extract] URLs extraídas:', { directUrl, pageUrl })

  return { directUrl, pageUrl }
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
