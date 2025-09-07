import { NextRequest, NextResponse } from 'next/server'

// Forçar renderização dinâmica para esta rota
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL da imagem é obrigatória' },
        { status: 400 }
      )
    }

    // Verificar se é uma URL do Google válida
    if (!imageUrl.includes('googleusercontent.com') && !imageUrl.includes('lh3.googleusercontent.com')) {
      return NextResponse.json(
        { error: 'Apenas URLs do Google são permitidas' },
        { status: 400 }
      )
    }

    console.log('🖼️ Fazendo proxy da imagem:', imageUrl)

    // Fazer a requisição para o Google com timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos timeout

    try {
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://accounts.google.com/',
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'cross-site'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error('❌ Erro ao buscar imagem do Google:', response.status, response.statusText)
        
        // Se for erro 403/401, tentar redirecionar para a URL original
        if (response.status === 403 || response.status === 401) {
          return NextResponse.redirect(imageUrl, 302)
        }
        
        return NextResponse.json(
          { error: 'Erro ao buscar imagem' },
          { status: response.status }
        )
      }

      // Obter o buffer da imagem
      const imageBuffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'image/jpeg'

      console.log('✅ Imagem carregada com sucesso:', {
        size: imageBuffer.byteLength,
        type: contentType
      })

      // Retornar a imagem com headers apropriados
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600', // Cache por 24 horas
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Vary': 'Accept-Encoding'
        }
      })
    } finally {
      clearTimeout(timeoutId)
    }

  } catch (error) {
    console.error('❌ Erro no proxy de imagem:', error)
    
    // Se for timeout ou erro de rede, tentar redirecionar
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      const imageUrl = new URL(request.url).searchParams.get('url')
      if (imageUrl) {
        console.log('🔄 Redirecionando para URL original:', imageUrl)
        return NextResponse.redirect(imageUrl, 302)
      }
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
