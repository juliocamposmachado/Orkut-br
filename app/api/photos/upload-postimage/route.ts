import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/photos/upload-postimage - Informações sobre a API
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API Proxy PostImage - Orkut BR',
    methods: ['POST'],
    description: 'Endpoint proxy para upload no PostImage.org sem problemas de CORS',
    timestamp: new Date().toISOString(),
    status: 'online'
  })
}

/**
 * POST /api/photos/upload-postimage - Proxy robusto para upload no PostImage.org
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🚀 [PostImage] Iniciando upload, timestamp:', new Date().toISOString())
  
  try {
    // Parse do FormData com timeout aumentado
    let formData: FormData
    try {
      formData = await Promise.race([
        request.formData(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao processar FormData (15s)')), 15000)
        )
      ])
      console.log('📦 [PostImage] FormData processado em', Date.now() - startTime, 'ms')
    } catch (error) {
      console.error('❌ [PostImage] Erro ao processar FormData:', error)
      return NextResponse.json({ 
        success: false,
        error: 'Timeout ao processar dados do formulário',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 408 })
    }
    
    const file = formData.get('file') as File
    
    if (!file) {
      console.error('❌ [PostImage] Nenhum arquivo encontrado no FormData')
      const keys = Array.from(formData.keys())
      console.log('📋 [PostImage] Campos disponíveis:', keys)
      return NextResponse.json({ 
        success: false,
        error: 'Nenhum arquivo enviado',
        available_fields: keys
      }, { status: 400 })
    }

    // Validações robustas
    const maxSize = 32 * 1024 * 1024 // 32MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB (máximo 32MB)`
      }, { status: 413 })
    }

    if (file.size === 0) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo vazio'
      }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json({
        success: false,
        error: `Tipo de arquivo não suportado: ${file.type}. Tipos permitidos: ${allowedTypes.join(', ')}`
      }, { status: 415 })
    }

    console.log('📄 [PostImage] Arquivo validado:', {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)}KB`,
      type: file.type
    })

    // Preparar FormData para PostImage.org com parâmetros corretos
    const postImageFormData = new FormData()
    postImageFormData.append('upload', file, file.name)
    postImageFormData.append('optsize', '0') // Tamanho original
    postImageFormData.append('expire', '0')  // Sem expiração
    postImageFormData.append('adult', 'no')  // Conteúdo não adulto
    
    // Headers melhorados
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }

    console.log('📤 [PostImage] Enviando para PostImage.org...')
    
    // Sistema de tentativas com timeout progressivo
    let response: Response | undefined
    const maxAttempts = 3
    const timeouts = [45000, 60000, 75000] // 45s, 60s, 75s
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const attemptStart = Date.now()
      try {
        console.log(`🔄 [PostImage] Tentativa ${attempt + 1}/${maxAttempts} (timeout: ${timeouts[attempt]/1000}s)`)
        
        response = await Promise.race([
          fetch('https://postimages.org/', {
            method: 'POST',
            body: postImageFormData,
            headers
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout na tentativa ${attempt + 1} (${timeouts[attempt]/1000}s)`)), timeouts[attempt])
          )
        ])
        
        console.log(`✅ [PostImage] Tentativa ${attempt + 1} bem-sucedida em ${Date.now() - attemptStart}ms`)
        break
        
      } catch (error) {
        const duration = Date.now() - attemptStart
        console.warn(`⚠️ [PostImage] Tentativa ${attempt + 1} falhou após ${duration}ms:`, error instanceof Error ? error.message : error)
        
        if (attempt === maxAttempts - 1) {
          throw new Error(`Todas as tentativas falharam. Última: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        }
        
        // Aguardar entre tentativas
        const waitTime = (attempt + 1) * 2000
        console.log(`⏳ [PostImage] Aguardando ${waitTime}ms antes da próxima tentativa`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }

    if (!response) {
      throw new Error('Nenhuma resposta obtida após todas as tentativas')
    }

    console.log(`📡 [PostImage] Resposta recebida: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      let errorDetails = `${response.status} ${response.statusText}`
      try {
        const errorText = await response.text()
        if (errorText.length < 1000) {
          errorDetails += ` - ${errorText}`
        }
      } catch {
        // Ignorar erros ao ler texto de erro
      }
      
      console.error('❌ [PostImage] Erro HTTP:', errorDetails)
      return NextResponse.json({
        success: false,
        error: `Erro do PostImage.org: ${errorDetails}`
      }, { status: 502 })
    }

    // Processar resposta
    const responseText = await response.text()
    const responseSize = responseText.length
    console.log(`📥 [PostImage] Resposta HTML recebida: ${responseSize} caracteres`)
    
    if (responseSize < 100) {
      console.error('❌ [PostImage] Resposta muito pequena, possível erro')
      return NextResponse.json({
        success: false,
        error: 'Resposta inválida do PostImage (muito pequena)'
      }, { status: 502 })
    }
    
    // Múltiplas estratégias para extrair URLs
    const extractionStrategies = [
      // Estratégia 1: URLs diretas i.postimg.cc
      {
        name: 'Direct URL (i.postimg.cc)',
        regex: /https?:\/\/i\.postimg\.cc\/[a-zA-Z0-9\/\-_\.]+/g
      },
      // Estratégia 2: URLs da página postimg.cc
      {
        name: 'Page URL (postimg.cc)',
        regex: /https?:\/\/postimg\.cc\/[a-zA-Z0-9\/\-_]+/g
      },
      // Estratégia 3: URLs em campos de input
      {
        name: 'Input value URLs',
        regex: /value=["']?(https?:\/\/[^"'\s>]+)["']?/g
      },
      // Estratégia 4: URLs em elementos de imagem
      {
        name: 'Image src URLs',
        regex: /src=["']?(https?:\/\/[^"'\s>]+\.(?:jpg|jpeg|png|gif|webp))["']?/gi
      }
    ]
    
    let directUrl = ''
    let pageUrl = ''
    
    for (const strategy of extractionStrategies) {
      const matches = Array.from(responseText.matchAll(strategy.regex))
      console.log(`🔍 [PostImage] ${strategy.name}: ${matches.length} matches`)
      
      for (const match of matches) {
        const url = match[1] || match[0]
        if (url.includes('i.postimg.cc') && !directUrl) {
          directUrl = url
        } else if (url.includes('postimg.cc') && !url.includes('i.postimg.cc') && !pageUrl) {
          pageUrl = url
        }
        
        if (directUrl && pageUrl) break
      }
      
      if (directUrl && pageUrl) break
    }
    
    // Fallback: usar a primeira URL encontrada
    if (!directUrl && !pageUrl) {
      const genericUrlMatch = responseText.match(/https?:\/\/[^\s"'<>]+/)
      if (genericUrlMatch) {
        directUrl = genericUrlMatch[0]
        console.log('🔍 [PostImage] Usando URL genérica como fallback:', directUrl)
      }
    }
    
    if (directUrl) {
      const result = {
        direct_url: directUrl,
        page_url: pageUrl || directUrl,
        thumb_url: directUrl,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        upload_time: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime
      }
      
      console.log('✅ [PostImage] Upload bem-sucedido:', {
        direct_url: result.direct_url,
        page_url: result.page_url,
        processing_time: `${result.processing_time_ms}ms`
      })
      
      return NextResponse.json({
        success: true,
        message: 'Upload realizado com sucesso',
        data: result
      })
      
    } else {
      // Log mais detalhado para debug
      console.error('❌ [PostImage] URLs não encontradas na resposta')
      console.log('📋 [PostImage] Primeiros 500 caracteres da resposta:')
      console.log(responseText.substring(0, 500))
      
      return NextResponse.json({
        success: false,
        error: 'Não foi possível extrair URLs da resposta do PostImage',
        debug_info: {
          response_size: responseSize,
          response_preview: responseText.substring(0, 200)
        }
      }, { status: 502 })
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    console.error(`❌ [PostImage] Erro após ${processingTime}ms:`, errorMessage)
    
    // Determinar código de status apropriado
    let statusCode = 500
    if (errorMessage.includes('Timeout')) {
      statusCode = 408 // Request Timeout
    } else if (errorMessage.includes('Arquivo')) {
      statusCode = 400 // Bad Request
    } else if (errorMessage.includes('PostImage')) {
      statusCode = 502 // Bad Gateway
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erro no upload para PostImage.org',
      details: errorMessage,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString()
    }, { status: statusCode })
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
