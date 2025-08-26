import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const imageUrl = url.searchParams.get('url')

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

    // Fazer a requisição para o Google
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })

    if (!response.ok) {
      console.error('❌ Erro ao buscar imagem do Google:', response.status, response.statusText)
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
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    console.error('❌ Erro no proxy de imagem:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
